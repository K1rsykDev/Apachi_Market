import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const ordersFile = path.join(dataDir, 'orders.json');
const examplesFile = path.join(dataDir, 'examples.json');

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });
  for (const file of [ordersFile, examplesFile]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, '[]');
    }
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });
  const token = authHeader.replace('Bearer ', '');
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (err) {
      cb(err, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuid()}${ext}`);
  }
});

const upload = multer({ storage });

async function readJson(file) {
  const content = await fs.readFile(file, 'utf-8');
  return JSON.parse(content);
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

app.get('/api/examples', async (req, res) => {
  await ensureStorage();
  const examples = await readJson(examplesFile);
  res.json(examples);
});

app.post('/api/examples', authMiddleware, upload.single('image'), async (req, res) => {
  await ensureStorage();
  const { title } = req.body;
  if (!title || !req.file) {
    return res.status(400).json({ message: 'Title and image are required' });
  }
  const examples = await readJson(examplesFile);
  const newExample = {
    id: uuid(),
    title,
    imageUrl: `/uploads/${req.file.filename}`,
    createdAt: new Date().toISOString()
  };
  examples.unshift(newExample);
  await writeJson(examplesFile, examples);
  res.status(201).json(newExample);
});

const orderUploads = upload.fields([
  { name: 'references', maxCount: 5 },
  { name: 'receipt', maxCount: 1 }
]);

app.post('/api/orders', orderUploads, async (req, res) => {
  await ensureStorage();
  const { nickname, type, description } = req.body;
  if (!nickname || !type || !description) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const references = (req.files.references || []).map((file) => `/uploads/${file.filename}`);
  const receiptFile = req.files.receipt?.[0];

  const orders = await readJson(ordersFile);
  const newOrder = {
    id: uuid(),
    nickname,
    type,
    description,
    references,
    receiptUrl: receiptFile ? `/uploads/${receiptFile.filename}` : null,
    paymentStatus: 'pending',
    status: 'new',
    createdAt: new Date().toISOString()
  };
  orders.unshift(newOrder);
  await writeJson(ordersFile, orders);
  res.status(201).json({ message: 'Order received', order: newOrder });
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  await ensureStorage();
  const orders = await readJson(ordersFile);
  res.json(orders);
});

app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  await ensureStorage();
  const orders = await readJson(ordersFile);
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

app.patch('/api/orders/:id', authMiddleware, async (req, res) => {
  await ensureStorage();
  const orders = await readJson(ordersFile);
  const index = orders.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Order not found' });

  const { paymentStatus, status } = req.body;
  if (paymentStatus) orders[index].paymentStatus = paymentStatus;
  if (status) orders[index].status = status;
  await writeJson(ordersFile, orders);
  res.json(orders[index]);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

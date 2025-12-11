import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const DATA_DIR = path.join(__dirname, '../data');
const UPLOAD_DIR = path.join(__dirname, '../uploads');

const ensureDirs = () => {
  const subDirs = ['', '/references', '/payments', '/examples'];
  subDirs.forEach((dir) => {
    const target = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
  });
};

ensureDirs();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'references') {
      cb(null, path.join(UPLOAD_DIR, 'references'));
    } else if (file.fieldname === 'paymentProof') {
      cb(null, path.join(UPLOAD_DIR, 'payments'));
    } else {
      cb(null, path.join(UPLOAD_DIR, 'examples'));
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${nanoid(6)}${ext}`);
  }
});

const upload = multer({ storage });

const readJson = (fileName) => {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (error) {
    console.error(`Failed to read ${fileName}:`, error);
    return [];
  }
};

const writeJson = (fileName, data) => {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const fileToUrl = (filePath) => {
  if (!filePath) return null;
  return `/uploads/${filePath}`;
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

app.post(
  '/api/orders',
  upload.fields([
    { name: 'references', maxCount: 5 },
    { name: 'paymentProof', maxCount: 1 }
  ]),
  (req, res) => {
    const { nickname, orderType, description } = req.body;
    if (!nickname || !orderType || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const references = (req.files?.references || []).map((file) => ({
      filename: file.filename,
      url: fileToUrl(`references/${file.filename}`)
    }));

    const paymentProofFile = req.files?.paymentProof?.[0];

    const orders = readJson('orders.json');
    const newOrder = {
      id: nanoid(8),
      nickname,
      orderType,
      description,
      references,
      paymentProof: paymentProofFile
        ? { filename: paymentProofFile.filename, url: fileToUrl(`payments/${paymentProofFile.filename}`) }
        : null,
      paymentStatus: 'pending',
      orderStatus: 'new',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    writeJson('orders.json', orders);

    return res.status(201).json({ message: 'Order submitted', order: newOrder });
  }
);

app.get('/api/orders', authMiddleware, (req, res) => {
  const orders = readJson('orders.json');
  const summary = orders.map(({ id, nickname, orderType, description, paymentStatus, orderStatus, createdAt }) => ({
    id,
    nickname,
    orderType,
    description: description.slice(0, 160),
    paymentStatus,
    orderStatus,
    createdAt
  }));
  return res.json(summary);
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const orders = readJson('orders.json');
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  return res.json(order);
});

app.patch('/api/orders/:id/status', authMiddleware, (req, res) => {
  const { paymentStatus, orderStatus } = req.body;
  const validPayment = ['pending', 'confirmed', 'rejected'];
  const validOrder = ['new', 'in_progress', 'completed', 'declined'];

  const orders = readJson('orders.json');
  const orderIndex = orders.findIndex((item) => item.id === req.params.id);

  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (paymentStatus && !validPayment.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Invalid payment status' });
  }

  if (orderStatus && !validOrder.includes(orderStatus)) {
    return res.status(400).json({ message: 'Invalid order status' });
  }

  if (paymentStatus) orders[orderIndex].paymentStatus = paymentStatus;
  if (orderStatus) orders[orderIndex].orderStatus = orderStatus;

  writeJson('orders.json', orders);
  return res.json({ message: 'Status updated', order: orders[orderIndex] });
});

app.get('/api/examples', (req, res) => {
  const examples = readJson('examples.json');
  return res.json(examples);
});

app.post('/api/examples', authMiddleware, upload.single('image'), (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Image is required' });
  }

  const examples = readJson('examples.json');
  const example = {
    id: nanoid(8),
    title,
    image: fileToUrl(`examples/${req.file.filename}`)
  };

  examples.push(example);
  writeJson('examples.json', examples);

  return res.status(201).json({ message: 'Example saved', example });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

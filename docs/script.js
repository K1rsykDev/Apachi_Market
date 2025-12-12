const STORAGE_KEYS = {
  examples: 'apachi_examples',
  orders: 'apachi_orders'
};

const seedExamples = [];

function readStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeeds() {
  const existing = readStorage(STORAGE_KEYS.examples, null);
  if (existing === null) {
    writeStorage(STORAGE_KEYS.examples, seedExamples);
  }
  if (readStorage(STORAGE_KEYS.orders, null) === null) {
    writeStorage(STORAGE_KEYS.orders, []);
  }
}

function renderExamples() {
  const grid = document.getElementById('examples-grid');
  const empty = document.getElementById('examples-empty');
  const examples = readStorage(STORAGE_KEYS.examples, []);
  grid.innerHTML = '';
  if (examples.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  examples.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'example-card';
    card.innerHTML = `
      <img src="${item.imageData}" alt="${item.title}">
      <div class="info">${item.title}</div>
    `;
    grid.appendChild(card);
  });
}

function fileListToDataUrls(fileList, limit = 5) {
  const files = Array.from(fileList || []).slice(0, limit);
  const readers = files.map(
    (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      })
  );
  return Promise.all(readers);
}

async function submitOrder(event) {
  event.preventDefault();
  const status = document.getElementById('order-status');
  status.textContent = 'Надсилаємо заявку...';

  try {
    const nickname = document.getElementById('nickname').value.trim();
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value.trim();
    const referencesInput = document.getElementById('references');
    const receiptInput = document.getElementById('receipt');

    const [references, receiptArr] = await Promise.all([
      fileListToDataUrls(referencesInput.files),
      fileListToDataUrls(receiptInput.files, 1)
    ]);

    const orders = readStorage(STORAGE_KEYS.orders, []);
    const newOrder = {
      id: Date.now(),
      nickname,
      type,
      description,
      references,
      receipt: receiptArr[0] || '',
      paymentStatus: 'pending',
      status: 'new',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    writeStorage(STORAGE_KEYS.orders, orders);
    event.target.reset();
    status.textContent = 'Заявка успішно збережена локально! Відкрийте адмінку для перегляду.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Сталася помилка. Спробуйте ще раз або перевірте файли.';
  }
}

ensureSeeds();
renderExamples();
document.getElementById('order-form').addEventListener('submit', submitOrder);

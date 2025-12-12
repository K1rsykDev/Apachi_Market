const STORAGE_KEYS = {
  examples: 'apachi_examples',
  orders: 'apachi_orders'
};

const ADMIN_PASSWORD = 'admin';

const loginForm = document.getElementById('login-form');
const loginCard = document.getElementById('login-card');
const panel = document.getElementById('panel');
const loginStatus = document.getElementById('login-status');
const ordersList = document.getElementById('orders-list');
const orderDetails = document.getElementById('order-details');
const ordersSection = document.getElementById('orders-section');
const examplesSection = document.getElementById('examples-section');
const examplesGrid = document.getElementById('examples-admin-grid');
const exampleForm = document.getElementById('example-form');
const exampleStatus = document.getElementById('example-status');

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
  if (readStorage(STORAGE_KEYS.examples, null) === null) {
    writeStorage(STORAGE_KEYS.examples, []);
  }
  if (readStorage(STORAGE_KEYS.orders, null) === null) {
    writeStorage(STORAGE_KEYS.orders, []);
  }
}

function login(event) {
  event.preventDefault();
  const password = document.getElementById('password').value;
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem('apachi_admin_logged', 'true');
    loginCard.style.display = 'none';
    panel.style.display = 'block';
    loginStatus.textContent = '';
    loadOrders();
    loadExamples();
  } else {
    loginStatus.textContent = 'Невірний пароль.';
  }
}

function logout() {
  localStorage.removeItem('apachi_admin_logged');
  panel.style.display = 'none';
  loginCard.style.display = 'block';
}

function renderOrdersList(orders) {
  ordersList.innerHTML = '';
  if (orders.length === 0) {
    ordersList.innerHTML = '<p class="muted">Немає заявок</p>';
    return;
  }
  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'service';
    card.innerHTML = `
      <strong>#${order.id}</strong><br>
      <span>${order.nickname}</span><br>
      <span>Тип: ${order.type}</span><br>
      <span>Оплата: ${order.paymentStatus}</span><br>
      <span>Статус: ${order.status}</span><br>
      <small>${new Date(order.createdAt).toLocaleString()}</small>
    `;
    card.addEventListener('click', () => renderOrderDetails(order.id));
    ordersList.appendChild(card);
  });
}

function loadOrders() {
  const orders = readStorage(STORAGE_KEYS.orders, []);
  renderOrdersList(orders);
  orderDetails.style.display = 'none';
}

function renderOrderDetails(id) {
  const orders = readStorage(STORAGE_KEYS.orders, []);
  const order = orders.find((o) => o.id === id);
  if (!order) {
    orderDetails.style.display = 'block';
    orderDetails.innerHTML = '<p class="muted">Заявку не знайдено</p>';
    return;
  }
  const references =
    order.references && order.references.length
      ? order.references
          .map((ref, idx) => `<a href="${ref}" target="_blank" rel="noopener">Референс ${idx + 1}</a>`)
          .join(', ')
      : 'Немає';
  const receipt = order.receipt ? `<a href="${order.receipt}" target="_blank" rel="noopener">Чек</a>` : 'Немає';

  orderDetails.style.display = 'block';
  orderDetails.innerHTML = `
    <h4>Заявка #${order.id}</h4>
    <p><strong>Нікнейм:</strong> ${order.nickname}</p>
    <p><strong>Тип:</strong> ${order.type}</p>
    <p><strong>Опис:</strong> ${order.description}</p>
    <p><strong>Референси:</strong> ${references}</p>
    <p><strong>Чек:</strong> ${receipt}</p>
    <p><strong>Оплата:</strong> ${order.paymentStatus}</p>
    <p><strong>Статус:</strong> ${order.status}</p>
    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
      <div class="form-group">
        <label>Статус оплати</label>
        <select id="payment-status">
          <option value="pending" ${order.paymentStatus === 'pending' ? 'selected' : ''}>Очікує</option>
          <option value="confirmed" ${order.paymentStatus === 'confirmed' ? 'selected' : ''}>Підтверджено</option>
          <option value="rejected" ${order.paymentStatus === 'rejected' ? 'selected' : ''}>Відхилено</option>
        </select>
      </div>
      <div class="form-group">
        <label>Статус замовлення</label>
        <select id="order-status">
          <option value="new" ${order.status === 'new' ? 'selected' : ''}>Нове</option>
          <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>У роботі</option>
          <option value="done" ${order.status === 'done' ? 'selected' : ''}>Виконане</option>
          <option value="rejected" ${order.status === 'rejected' ? 'selected' : ''}>Відхилене</option>
        </select>
      </div>
    </div>
    <button class="btn primary" style="margin-top:12px;" id="save-status">Зберегти статуси</button>
    <p id="status-message" class="muted"></p>
  `;
  document.getElementById('save-status').onclick = () => updateOrder(order.id);
}

function updateOrder(id) {
  const orders = readStorage(STORAGE_KEYS.orders, []);
  const orderIndex = orders.findIndex((o) => o.id === id);
  const msg = document.getElementById('status-message');
  if (orderIndex === -1) {
    msg.textContent = 'Заявку не знайдено';
    return;
  }
  orders[orderIndex].paymentStatus = document.getElementById('payment-status').value;
  orders[orderIndex].status = document.getElementById('order-status').value;
  writeStorage(STORAGE_KEYS.orders, orders);
  msg.textContent = 'Збережено';
  renderOrdersList(orders);
}

function loadExamples() {
  const examples = readStorage(STORAGE_KEYS.examples, []);
  examplesGrid.innerHTML = '';
  if (!examples.length) {
    examplesGrid.innerHTML = '<p class="muted">Немає прикладів</p>';
    return;
  }
  examples.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'example-card';
    card.innerHTML = `
      <img src="${item.imageData}" alt="${item.title}">
      <div class="info">${item.title}</div>
    `;
    examplesGrid.appendChild(card);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function addExample(event) {
  event.preventDefault();
  exampleStatus.textContent = 'Завантажуємо...';
  const title = document.getElementById('example-title').value.trim();
  const file = document.getElementById('example-image').files[0];
  if (!file) {
    exampleStatus.textContent = 'Додайте зображення';
    return;
  }
  try {
    const imageData = await fileToDataUrl(file);
    const examples = readStorage(STORAGE_KEYS.examples, []);
    examples.push({ id: Date.now(), title, imageData });
    writeStorage(STORAGE_KEYS.examples, examples);
    exampleForm.reset();
    exampleStatus.textContent = 'Додано!';
    loadExamples();
  } catch (err) {
    console.error(err);
    exampleStatus.textContent = 'Не вдалося додати приклад';
  }
}

function initTabs() {
  const ordersBtn = document.getElementById('tab-orders');
  const examplesBtn = document.getElementById('tab-examples');
  ordersBtn.addEventListener('click', () => {
    ordersSection.style.display = 'block';
    examplesSection.style.display = 'none';
  });
  examplesBtn.addEventListener('click', () => {
    ordersSection.style.display = 'none';
    examplesSection.style.display = 'block';
  });
}

loginForm.addEventListener('submit', login);
exampleForm.addEventListener('submit', addExample);
document.getElementById('logout').addEventListener('click', logout);
initTabs();
ensureSeeds();

if (localStorage.getItem('apachi_admin_logged') === 'true') {
  loginCard.style.display = 'none';
  panel.style.display = 'block';
  loadOrders();
  loadExamples();
}

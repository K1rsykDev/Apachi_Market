let API_BASE = localStorage.getItem('apiBase') || 'http://localhost:3001';
let token = localStorage.getItem('adminToken') || '';

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

async function login(event) {
  event.preventDefault();
  const backendInput = document.getElementById('backend-url').value.trim();
  const password = document.getElementById('password').value;
  API_BASE = backendInput || API_BASE;
  loginStatus.textContent = 'Входимо...';
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('Auth failed');
    const data = await res.json();
    token = data.token;
    localStorage.setItem('adminToken', token);
    localStorage.setItem('apiBase', API_BASE);
    loginCard.style.display = 'none';
    panel.style.display = 'block';
    loadOrders();
    loadExamples();
  } catch (err) {
    loginStatus.textContent = 'Невірний пароль або бекенд недоступний';
  }
}

async function loadOrders() {
  ordersList.innerHTML = '<p class="muted">Завантажуємо...</p>';
  orderDetails.style.display = 'none';
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    ordersList.innerHTML = '';
    if (!data.length) {
      ordersList.innerHTML = '<p class="muted">Немає заявок</p>';
      return;
    }
    data.forEach((order) => {
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
      card.addEventListener('click', () => loadOrder(order.id));
      ordersList.appendChild(card);
    });
  } catch (err) {
    ordersList.innerHTML = '<p class="muted">Не вдалося отримати заявки</p>';
  }
}

async function loadOrder(id) {
  orderDetails.style.display = 'block';
  orderDetails.innerHTML = '<p class="muted">Завантажуємо...</p>';
  try {
    const res = await fetch(`${API_BASE}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const order = await res.json();
    const references =
      order.references.map((ref) => `<a href="${API_BASE}${ref}" target="_blank">Переглянути</a>`).join(', ') ||
      'Немає';
    const receipt = order.receiptUrl ? `<a href="${API_BASE}${order.receiptUrl}" target="_blank">Чек</a>` : 'Немає';
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
    document.getElementById('save-status').onclick = () => updateOrder(id);
  } catch (err) {
    orderDetails.innerHTML = '<p class="muted">Не вдалося завантажити заявку</p>';
  }
}

async function updateOrder(id) {
  const paymentStatus = document.getElementById('payment-status').value;
  const status = document.getElementById('order-status').value;
  const msg = document.getElementById('status-message');
  msg.textContent = 'Зберігаємо...';
  try {
    const res = await fetch(`${API_BASE}/api/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ paymentStatus, status })
    });
    if (!res.ok) throw new Error('update fail');
    msg.textContent = 'Оновлено!';
    loadOrders();
  } catch (err) {
    msg.textContent = 'Помилка збереження';
  }
}

async function loadExamples() {
  examplesGrid.innerHTML = '<p class="muted">Завантажуємо...</p>';
  try {
    const res = await fetch(`${API_BASE}/api/examples`);
    const data = await res.json();
    examplesGrid.innerHTML = '';
    data.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'example-card';
      card.innerHTML = `
        <img src="${API_BASE}${item.imageUrl}" alt="${item.title}">
        <div class="info">${item.title}</div>
      `;
      examplesGrid.appendChild(card);
    });
  } catch (err) {
    examplesGrid.innerHTML = '<p class="muted">Не вдалося отримати приклади</p>';
  }
}

async function addExample(event) {
  event.preventDefault();
  exampleStatus.textContent = 'Завантажуємо...';
  const formData = new FormData(exampleForm);
  try {
    const res = await fetch(`${API_BASE}/api/examples`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error('fail');
    exampleForm.reset();
    exampleStatus.textContent = 'Додано!';
    loadExamples();
  } catch (err) {
    exampleStatus.textContent = 'Не вдалося додати приклад';
  }
}

function logout() {
  token = '';
  localStorage.removeItem('adminToken');
  panel.style.display = 'none';
  loginCard.style.display = 'block';
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

if (token) {
  loginCard.style.display = 'none';
  panel.style.display = 'block';
  loadOrders();
  loadExamples();
}

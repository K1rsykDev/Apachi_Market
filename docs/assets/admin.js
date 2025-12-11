import { API_BASE_URL } from './config.js';

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('loginMessage');
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const ordersTable = document.getElementById('ordersTable');
const orderDetail = document.getElementById('orderDetail');
const exampleForm = document.getElementById('exampleForm');
const exampleMessage = document.getElementById('exampleMessage');
const adminExamples = document.getElementById('adminExamples');
const logoutBtn = document.getElementById('logout');
const ordersTab = document.getElementById('ordersTab');
const examplesTab = document.getElementById('examplesTab');
const ordersPanel = document.getElementById('ordersPanel');
const examplesPanel = document.getElementById('examplesPanel');

const getToken = () => localStorage.getItem('adminToken');

const authFetch = (url, options = {}) => {
  const token = getToken();
  const headers = options.headers ? { ...options.headers } : {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
};

const renderOrdersTable = (orders) => {
  if (!orders.length) {
    ordersTable.innerHTML = '<div class="gallery-empty">Заявок поки немає.</div>';
    return;
  }

  const rows = orders
    .map(
      (order) => `
        <tr>
          <td>${order.id}</td>
          <td>${order.nickname}</td>
          <td><span class="badge">${order.orderType}</span></td>
          <td>${order.description}</td>
          <td><span class="status ${order.paymentStatus}">${order.paymentStatus}</span></td>
          <td><span class="status ${order.orderStatus}">${order.orderStatus}</span></td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
          <td><button class="button secondary" data-id="${order.id}">Відкрити</button></td>
        </tr>
      `
    )
    .join('');

  ordersTable.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Нікнейм</th>
          <th>Тип</th>
          <th>Опис</th>
          <th>Оплата</th>
          <th>Статус</th>
          <th>Створено</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  ordersTable.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => loadOrderDetail(btn.dataset.id));
  });
};

const renderOrderDetail = (order) => {
  const refs = order.references
    .map((file) => `<a href="${API_BASE_URL}${file.url}" target="_blank">${file.filename}</a>`) 
    .join('<br/>');
  const proof = order.paymentProof ? `<a href="${API_BASE_URL}${order.paymentProof.url}" target="_blank">${order.paymentProof.filename}</a>` : '—';

  orderDetail.style.display = 'grid';
  orderDetail.innerHTML = `
    <div>
      <h3>Заявка ${order.id}</h3>
      <p><strong>Нікнейм:</strong> ${order.nickname}</p>
      <p><strong>Тип:</strong> ${order.orderType}</p>
      <p><strong>Опис:</strong> ${order.description}</p>
      <p><strong>Референси:</strong><br/> ${refs || '—'}</p>
      <p><strong>Чек оплати:</strong> ${proof}</p>
    </div>
    <div>
      <div>
        <label class="label">Статус оплати</label>
        <select id="paymentStatus" class="input">
          <option value="pending" ${order.paymentStatus === 'pending' ? 'selected' : ''}>Очікує</option>
          <option value="confirmed" ${order.paymentStatus === 'confirmed' ? 'selected' : ''}>Підтверджено</option>
          <option value="rejected" ${order.paymentStatus === 'rejected' ? 'selected' : ''}>Відхилено</option>
        </select>
      </div>
      <div style="margin-top: 12px;">
        <label class="label">Статус замовлення</label>
        <select id="orderStatus" class="input">
          <option value="new" ${order.orderStatus === 'new' ? 'selected' : ''}>Нове</option>
          <option value="in_progress" ${order.orderStatus === 'in_progress' ? 'selected' : ''}>У роботі</option>
          <option value="completed" ${order.orderStatus === 'completed' ? 'selected' : ''}>Виконане</option>
          <option value="declined" ${order.orderStatus === 'declined' ? 'selected' : ''}>Відхилено</option>
        </select>
      </div>
      <button class="button" id="saveStatus" style="margin-top: 16px;">Зберегти</button>
    </div>
  `;

  document.getElementById('saveStatus').addEventListener('click', async () => {
    const paymentStatus = document.getElementById('paymentStatus').value;
    const orderStatus = document.getElementById('orderStatus').value;

    const res = await authFetch(`${API_BASE_URL}/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus, orderStatus })
    });

    if (res.ok) {
      await loadOrders();
      await loadOrderDetail(order.id);
    }
  });
};

const loadOrders = async () => {
  const res = await authFetch(`${API_BASE_URL}/api/orders`);
  if (res.status === 401) {
    showLoggedOut();
    return;
  }
  const data = await res.json();
  renderOrdersTable(data);
};

const loadOrderDetail = async (id) => {
  const res = await authFetch(`${API_BASE_URL}/api/orders/${id}`);
  if (!res.ok) return;
  const order = await res.json();
  renderOrderDetail(order);
};

const loadExamples = async () => {
  const res = await authFetch(`${API_BASE_URL}/api/examples`);
  const data = await res.json();
  adminExamples.innerHTML = '';
  data.forEach((example) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${API_BASE_URL}${example.image}" alt="${example.title}" />
      <div class="card-body">
        <h3>${example.title}</h3>
      </div>
    `;
    adminExamples.appendChild(card);
  });
};

const handleLogin = async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';
  const payload = { username: usernameInput.value, password: passwordInput.value };
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    loginMessage.className = 'alert error';
    loginMessage.textContent = 'Невірні дані';
    return;
  }

  const data = await res.json();
  localStorage.setItem('adminToken', data.token);
  showLoggedIn();
  await loadOrders();
  await loadExamples();
};

const handleExampleSubmit = async (event) => {
  event.preventDefault();
  exampleMessage.textContent = '';
  const formData = new FormData(exampleForm);

  const res = await authFetch(`${API_BASE_URL}/api/examples`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json();
    exampleMessage.className = 'alert error';
    exampleMessage.textContent = err.message || 'Помилка';
    return;
  }

  exampleMessage.className = 'alert';
  exampleMessage.textContent = 'Приклад додано';
  exampleForm.reset();
  await loadExamples();
};

const showLoggedIn = () => {
  loginSection.style.display = 'none';
  adminSection.style.display = 'block';
};

const showLoggedOut = () => {
  localStorage.removeItem('adminToken');
  adminSection.style.display = 'none';
  loginSection.style.display = 'block';
};

const handleLogout = () => {
  showLoggedOut();
};

const initTabs = () => {
  ordersTab.addEventListener('click', () => {
    ordersTab.classList.add('active');
    examplesTab.classList.remove('active');
    ordersPanel.style.display = 'block';
    examplesPanel.style.display = 'none';
  });

  examplesTab.addEventListener('click', () => {
    examplesTab.classList.add('active');
    ordersTab.classList.remove('active');
    ordersPanel.style.display = 'none';
    examplesPanel.style.display = 'block';
  });
};

initTabs();
loginForm.addEventListener('submit', handleLogin);
exampleForm.addEventListener('submit', handleExampleSubmit);
logoutBtn.addEventListener('click', handleLogout);

if (getToken()) {
  showLoggedIn();
  loadOrders();
  loadExamples();
}

const API_BASE = localStorage.getItem('apiBase') || 'http://localhost:3001';

async function fetchExamples() {
  const grid = document.getElementById('examples-grid');
  const empty = document.getElementById('examples-empty');
  grid.innerHTML = '';
  try {
    const res = await fetch(`${API_BASE}/api/examples`);
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      empty.style.display = 'none';
      data.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'example-card';
        card.innerHTML = `
          <img src="${API_BASE}${item.imageUrl}" alt="${item.title}">
          <div class="info">${item.title}</div>
        `;
        grid.appendChild(card);
      });
    } else {
      empty.style.display = 'block';
    }
  } catch (err) {
    empty.style.display = 'block';
    empty.textContent = 'Не вдалося завантажити приклади. Перевірте підключення до бекенду.';
  }
}

async function submitOrder(event) {
  event.preventDefault();
  const status = document.getElementById('order-status');
  status.textContent = 'Надсилаємо заявку...';
  const form = event.target;
  const formData = new FormData(form);

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Помилка при надсиланні');
    form.reset();
    status.textContent = 'Заявка успішно надіслана! Ми звʼяжемось з вами найближчим часом.';
  } catch (err) {
    status.textContent = 'Сталася помилка. Перевірте підключення та спробуйте ще раз.';
  }
}

document.getElementById('order-form').addEventListener('submit', submitOrder);
fetchExamples();

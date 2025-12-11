import { API_BASE_URL } from './config.js';

const examplesContainer = document.getElementById('examplesContainer');
const examplesEmpty = document.getElementById('examplesEmpty');
const orderForm = document.getElementById('orderForm');
const submitOrder = document.getElementById('submitOrder');
const orderMessage = document.getElementById('orderMessage');

const createExampleCard = (example) => {
  const card = document.createElement('div');
  card.className = 'card';
  const img = document.createElement('img');
  img.src = `${API_BASE_URL}${example.image}`;
  img.alt = example.title;
  const body = document.createElement('div');
  body.className = 'card-body';
  const title = document.createElement('h3');
  title.textContent = example.title;
  body.appendChild(title);
  card.appendChild(img);
  card.appendChild(body);
  return card;
};

const loadExamples = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/examples`);
    const data = await res.json();
    examplesContainer.innerHTML = '';

    if (!data.length) {
      examplesEmpty.style.display = 'block';
      return;
    }

    examplesEmpty.style.display = 'none';
    data.forEach((example) => {
      examplesContainer.appendChild(createExampleCard(example));
    });
  } catch (error) {
    console.error(error);
    examplesEmpty.style.display = 'block';
    examplesEmpty.textContent = 'Не вдалося завантажити приклади. Перевірте бекенд.';
  }
};

const handleOrderSubmit = async (event) => {
  event.preventDefault();
  orderMessage.textContent = '';
  submitOrder.disabled = true;

  const formData = new FormData(orderForm);

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Помилка при створенні замовлення');
    }

    orderMessage.className = 'alert';
    orderMessage.textContent = 'Заявку надіслано! Ми зв’яжемося після перевірки оплати.';
    orderForm.reset();
  } catch (error) {
    orderMessage.className = 'alert error';
    orderMessage.textContent = error.message;
  } finally {
    submitOrder.disabled = false;
  }
};

loadExamples();
orderForm?.addEventListener('submit', handleOrderSubmit);

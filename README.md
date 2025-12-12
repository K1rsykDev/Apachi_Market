# Apachi Design Market

Повноцінний мінімалістичний проєкт для продажу графічних послуг (аватарки, банери, прев'юшки та інше). Складається з фронтенду, який можна деплоїти на GitHub Pages, та бекенду на Node.js + Express із завантаженням файлів.

## Швидкий старт
### Вимоги
- Node.js 18+
- npm

### Встановлення залежностей
```
cd backend
npm install
```

### Запуск бекенду локально
```
cd backend
npm start
```
Сервер за замовчуванням стартує на `http://localhost:3001`.

#### Налаштування середовища
Створіть `.env` у папці `backend` (не обов'язково):
```
PORT=3001
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret
```

### Структура API
- `POST /api/auth/login` — вхід в адмін-панель (body: `{ password }`).
- `POST /api/orders` — створення заявки (FormData: `nickname`, `type`, `description`, `references[]`, `receipt`).
- `GET /api/orders` — список заявок (адмін, Bearer token).
- `GET /api/orders/:id` — деталі заявки (адмін).
- `PATCH /api/orders/:id` — оновлення статусів (body: `{ paymentStatus, status }`, адмін).
- `GET /api/examples` — список прикладів робіт.
- `POST /api/examples` — додавання прикладу (адмін, FormData: `title`, `image`).

Файли завантажуються у `backend/uploads` і віддаються статично через `/uploads/...`.

### Підготовка фронтенду для GitHub Pages
Статичні файли знаходяться в каталозі `docs/`. Для GitHub Pages (гілка `main`):
1. Закомітьте репозиторій.
2. У налаштуваннях GitHub увімкніть Pages з джерелом `Deploy from a branch` → `main` → `/docs`.
3. Оновіть у браузері URL бекенду у полі входу на сторінці `admin.html` або встановіть локально `localStorage.setItem('apiBase', 'https://your-backend-host');`.

### Деплой бекенду на Render (або інший Node.js хостинг)
1. Створіть новий Web Service з Git репозиторію.
2. Runtime: Node.js; Build Command: `npm install`; Start Command: `npm start`; Root Directory: `backend`.
3. Додайте змінні середовища `ADMIN_PASSWORD` та `JWT_SECRET`.
4. Після деплою використовуйте отриманий домен як `API_BASE` для фронтенду.

## Файлова структура
- `backend/` — сервер Express, збереження заявок у JSON, завантаження файлів через Multer.
- `docs/` — статичний фронтенд для Pages: головна сторінка (`index.html`), адмінка (`admin.html`), стилі та скрипти.
- `.gitignore` — виключає `node_modules`, `.env`, завантаження та локальні дані.

## Заявки та адмін-панель
- На головній (`index.html`) є форма заявки з прикріпленням референсів і чека.
- Адмін-панель (`admin.html`) захищена паролем, дозволяє:
  - Переглядати список заявок і деталі з файлами.
  - Оновлювати статус оплати та виконання.
  - Додавати приклади робіт для галереї.

## Поради щодо продакшену
- Розгорніть бекенд із постійним стореджем (Render disk/volume, S3 тощо) або замініть JSON на базу даних.
- Оновіть паролі та секрети перед публічним запуском.

# Apachi Market

Повноцінний приклад сайту для продажу графічних послуг із клієнтською частиною для GitHub Pages та окремим бекенд-сервером на Node.js/Express.

## Структура репозиторію

- `docs/` — статичний фронтенд, готовий до деплою на GitHub Pages (головна сторінка та адмінка).
- `backend/` — API-сервер, що приймає замовлення, керує статусами та портфоліо й обслуговує завантажені файли.
- `backend/data/` — JSON-файли збереження (`orders.json`, `examples.json`).
- `backend/uploads/` — директорії для завантажених референсів, чеків та прикладів робіт.

## Налаштування та запуск бекенда локально

1. Встановіть Node.js 18+.
2. Встановіть залежності:

   ```bash
   cd backend
   npm install
   ```

3. Створіть файл `.env` або задайте змінні середовища:

   ```bash
   PORT=4000
   ADMIN_USER=admin
   ADMIN_PASSWORD=admin123
   JWT_SECRET=your-secret
   ```

4. Запустіть сервер:

   ```bash
   npm start
   ```

   Сервер буде доступний за `http://localhost:4000`.

### API стисло

- `POST /api/auth/login` — логін адміністратора, повертає JWT.
- `POST /api/orders` — створення заявки (FormData: `nickname`, `orderType`, `description`, файли `references[]`, `paymentProof`).
- `GET /api/orders` — список заявок (потрібен Bearer токен).
- `GET /api/orders/:id` — деталі заявки (потрібен Bearer токен).
- `PATCH /api/orders/:id/status` — оновлення статусів (`paymentStatus`: `pending|confirmed|rejected`, `orderStatus`: `new|in_progress|completed|declined`).
- `GET /api/examples` — публічний список прикладів робіт.
- `POST /api/examples` — створення прикладу (FormData: `title`, `image`, потрібен Bearer токен).
- Статичні файли: `/uploads/...`.

## Фронтенд (GitHub Pages)

- Усі статичні файли лежать у `docs/`. Для GitHub Pages достатньо опублікувати цю папку як root сайту.
- API-база вказана в `docs/assets/config.js` (за замовчуванням `http://localhost:4000`). Для продакшн-запуску змініть на URL задеплоєного бекенда.
- Головна сторінка: показує послуги, галерею прикладів через `/api/examples`, форму заявки з завантаженням файлів через `/api/orders`.
- `admin.html`: авторизація, таблиця заявок зі зміною статусів, перегляд деталей із файлами, додавання прикладів робіт.

### Розгортання на GitHub Pages

1. Переконайтеся, що `docs/` є коренем для Pages (налаштування GitHub → Pages → Source → Deploy from branch → оберіть гілку та папку `docs/`).
2. Оновіть `docs/assets/config.js`, щоб API вказував на ваш продакшн-бекенд.

## Деплой бекенда (приклад Render)

1. Створіть новий веб-сервіс на Render із репозиторію.
2. Установіть команди:
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && npm start`
3. Додайте env-параметри `PORT`, `ADMIN_USER`, `ADMIN_PASSWORD`, `JWT_SECRET`.
4. Після деплою скопіюйте URL сервісу та пропишіть його в `docs/assets/config.js`, потім оновіть GitHub Pages.

## Зберігання даних

- Замовлення й приклади зберігаються у `backend/data/orders.json` та `backend/data/examples.json` відповідно.
- Завантажені файли зберігаються у `backend/uploads/` (структура створюється автоматично при старті).

## Розробка

- Режим дев-сервера: `npm run dev` (з `nodemon`).
- Код написано без додаткових збірників — простий HTML/CSS/JS для фронтенда й Express для бекенда.

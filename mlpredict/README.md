# MLBB Predictions — Telegram Mini App

Система ставок на матчи Mobile Legends Bang Bang.
Только виртуальные баллы, никаких реальных денег.

---

## 🏗 Структура проекта

```
mlbb-app/
├── backend/          # FastAPI (Python)
├── frontend/         # React + Vite + Tailwind
└── bot/              # Telegram бот
```

---

## 🚀 Деплой

### 1. База данных — Supabase (бесплатно)
1. Зарегистрируйся на [supabase.com](https://supabase.com)
2. Создай новый проект
3. Скопируй Connection String (postgresql+asyncpg://...)

### 2. Backend — Render (бесплатно)
1. Зарегистрируйся на [render.com](https://render.com)
2. New → Web Service → подключи GitHub репо
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Добавь Environment Variables:
   - `DATABASE_URL` — из Supabase
   - `SECRET_KEY` — любая случайная строка
   - `BOT_TOKEN` — токен от @BotFather
   - `ADMIN_SECRET` — пароль для админки (придумай сам)
   - `WEBHOOK_URL` — https://your-app.onrender.com (URL после деплоя)
   - `FRONTEND_URL` — https://your-app.vercel.app (URL после деплоя фронта)

### 3. Frontend — Vercel (бесплатно)
1. Зарегистрируйся на [vercel.com](https://vercel.com)
2. New Project → подключи GitHub репо
3. Root Directory: `frontend`
4. Добавь Environment Variable:
   - `VITE_API_URL` = URL твоего Render сервиса
5. Deploy!

### 4. Telegram бот — @BotFather
1. `/newbot` → получи BOT_TOKEN
2. `/setmenubutton` → настрой кнопку Menu
3. `/newapp` или через настройки бота → добавь Mini App URL (Vercel URL)
4. Или через `@BotFather` → Bot Settings → Menu Button → URL Mini App

### 5. Антизасыпание Render
1. Зарегистрируйся на [uptimerobot.com](https://uptimerobot.com)
2. New Monitor → HTTP(s) → URL: `https://your-app.onrender.com/health`
3. Интервал: каждые 5 минут

---

## 🔑 Админ-панель

Все запросы к `/api/v1/tournaments/` (POST/PUT/DELETE) и `/api/v1/matches/` требуют заголовок:
```
X-Admin-Secret: <твой ADMIN_SECRET>
```

Используй любой REST-клиент (Insomnia, Postman, curl) или создай отдельную веб-страницу.

### Создание матча (пример curl):
```bash
curl -X POST https://your-app.onrender.com/api/v1/matches/ \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{
    "tournament_id": 1,
    "team1_name": "ONIC",
    "team2_name": "RRQ",
    "series_type": "bo3",
    "scheduled_at": "2024-12-01T14:00:00",
    "kills_options": ["<200", "200-250", ">250"],
    "duration_options": ["<15 мин", "15-20 мин", ">20 мин"],
    "team1_players": ["Kairi", "Sanz", "Hoshi", "Butsss", "CW"],
    "team2_players": ["Alberttt", "Lemon", "R7", "Antimage", "Psycho"]
  }'
```

### Внесение результатов:
```bash
curl -X POST https://your-app.onrender.com/api/v1/matches/1/results \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{
    "result_winner": "ONIC",
    "result_score": "2-1",
    "result_kills_total": "200-250",
    "result_duration": "15-20 мин",
    "result_first_blood": "Kairi",
    "result_mvp": "Hoshi"
  }'
```
После этого баллы автоматически начислятся всем пользователям.

---

## 📊 Система баллов

| Прогноз | Верно | Неверно |
|---------|-------|---------|
| Тотал киллов | +5 | 0 |
| Длительность карты | +5 | 0 |
| Первая кровь | +10 | 0 |
| MVP карты | +5 | 0 |
| Победитель матча | +1 | 0 |
| Счёт серии | ставка × коэффициент | 0 |

**Коэффициенты счёта серии:**
- Bo3: 2-0 → ×1.5, 2-1 → ×2.0
- Bo5: 3-0 → ×2.5, 3-1 → ×2.0, 3-2 → ×1.5
- Bo7: 4-0 → ×3.0, 4-1 → ×2.5, 4-2 → ×2.0, 4-3 → ×1.5

Баллы за ставку счёта списываются сразу. Если прогноз верный — возвращаются × коэффициент.

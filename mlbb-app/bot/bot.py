import asyncio
import logging
import os
import httpx
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from dotenv import load_dotenv

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://your-app.vercel.app")
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")
API_URL = os.getenv("API_URL", "https://mlbb-predictions-api.onrender.com")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Texts ──────────────────────────────────────────────────────────────────────

WELCOME_TEXT = """
👋 Привет, <b>{name}</b>! Добро пожаловать в <b>MLBB Predictions</b>!

Это сервис прогнозов на матчи киберспорта по Mobile Legends: Bang Bang.

<b>Как это работает:</b>
• Делай прогнозы на матчи до их начала
• Зарабатывай баллы за точные прогнозы
• Соревнуйся с другими в таблице лидеров

👇 Нажми кнопку чтобы открыть приложение или /faq чтобы узнать подробнее:
"""

FAQ_TEXT = """📖 <b>Часто задаваемые вопросы</b>

<b>Что такое MLBB Predictions?</b>
Развлекательный сервис прогнозов на матчи по Mobile Legends: Bang Bang. Делаешь прогнозы — зарабатываешь виртуальные баллы.

<b>Это платно или азартные игры?</b>
Нет и нет. Сервис полностью бесплатный. Баллы виртуальные — нельзя вывести или обменять на деньги. Это не азартная игра по законодательству РФ.

<b>Какие прогнозы доступны?</b>
• 🏆 Победитель матча — <b>+1 балл</b>
• 📊 Счёт серии — <b>× коэффициент</b> (ставишь свои баллы)
• 🔫 Тотал киллов — <b>+5 баллов</b>
• ⏱ Длительность карты — <b>+5 баллов</b>
• 🩸 Первая кровь (каждая карта) — <b>+10 баллов</b>
• ⭐ MVP (каждая карта) — <b>+5 баллов</b>

<b>До когда принимаются прогнозы?</b>
До момента закрытия приёма, обычно за 10–15 минут до начала матча.

<b>Когда начисляются баллы?</b>
Сразу после того как администратор внесёт результаты матча.

<b>Как работает ставка на счёт серии?</b>
Выбираешь счёт и ставишь любое количество своих баллов. При верном прогнозе баллы умножаются на коэффициент (от ×1.5 до ×3.0). При неверном — списываются.

<b>Могут ли заблокировать аккаунт?</b>
Да, за нарушение правил: несколько аккаунтов, мошенничество и т.д.

<b>Как связаться с поддержкой?</b>
Через администратора бота напрямую в Telegram.
"""

TERMS_TEXT = """📋 <b>Пользовательское соглашение</b>

Используя сервис MLBB Predictions, вы соглашаетесь:

<b>1. Сервис развлекательный</b>
MLBB Predictions — бесплатный сервис прогнозов. Никаких денежных взносов не требуется.

<b>2. Виртуальные баллы</b>
Все баллы в сервисе виртуальные. Они не имеют денежного эквивалента и не могут быть обменяны на деньги, товары или услуги.

<b>3. Не является азартной игрой</b>
Сервис не является азартной игрой, лотереей или букмекерской деятельностью согласно ФЗ-244 и ФЗ-138, так как не предполагает денежных взносов и денежного выигрыша.

<b>4. Правила участия</b>
Запрещено создавать несколько аккаунтов, использовать сервис в мошеннических целях, нарушать работу сервиса.

<b>5. Персональные данные</b>
Мы храним только необходимые данные из вашего Telegram-профиля. Данные не продаются третьим лицам. Подробнее: /privacy

Нажимая «Принимаю», вы подтверждаете согласие с условиями.
"""

PRIVACY_TEXT = """🔒 <b>Политика конфиденциальности</b>

<b>Что мы собираем:</b>
• Telegram ID, имя, @username
• Никнейм и Game ID в MLBB (указываете сами)
• Игровая статистика (баллы, прогнозы)

<b>Зачем:</b>
Исключительно для работы сервиса — идентификация, начисление баллов, таблица лидеров.

<b>Передача третьим лицам:</b>
Данные не продаются и не передаются, кроме случаев предусмотренных законодательством РФ.

<b>Хранение:</b>
Данные хранятся на защищённых серверах (Supabase, Render) по HTTPS/TLS.

<b>Ваши права:</b>
Вы можете запросить удаление своих данных, обратившись к администратору.

<b>Удаление данных:</b>
Напишите администратору — запрос будет выполнен в течение 7 рабочих дней.
"""


# ── Handlers ───────────────────────────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    keyboard = [[
        InlineKeyboardButton("Открыть приложение", web_app=WebAppInfo(url=FRONTEND_URL))
    ], [
        InlineKeyboardButton("FAQ", callback_data="faq"),
        InlineKeyboardButton("Соглашение", callback_data="terms"),
    ]]
    await update.message.reply_text(
        WELCOME_TEXT.format(name=user.first_name),
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def faq_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("Открыть приложение", web_app=WebAppInfo(url=FRONTEND_URL))]]
    await update.message.reply_text(
        FAQ_TEXT, parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def terms_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(TERMS_TEXT, parse_mode="HTML")


async def privacy_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(PRIVACY_TEXT, parse_mode="HTML")


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    if query.data == "faq":
        await query.message.reply_text(FAQ_TEXT, parse_mode="HTML")
    elif query.data == "terms":
        await query.message.reply_text(TERMS_TEXT, parse_mode="HTML")
    elif query.data == "privacy":
        await query.message.reply_text(PRIVACY_TEXT, parse_mode="HTML")


# ── Notification helpers (called from API) ─────────────────────────────────────

async def notify_match_created(bot, match: dict):
    """Send notification to all active users about new match predictions opening."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{API_URL}/api/v1/users/admin/all",
                headers={"X-Admin-Secret": ADMIN_SECRET},
                timeout=10
            )
            if resp.status_code != 200:
                return
            users_data = resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch users for notification: {e}")
            return

    series = match.get("series_type", "").upper()
    team1 = match.get("team1_name", "")
    team2 = match.get("team2_name", "")

    text = (
        f"🔔 <b>Прогнозы открыты!</b>\n\n"
        f"⚔️ <b>{team1}</b> vs <b>{team2}</b>\n"
        f"📋 Формат: <b>{series}</b>\n\n"
        f"Успей сделать прогноз до начала матча!"
    )
    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton("Сделать прогноз", web_app=WebAppInfo(url=FRONTEND_URL))
    ]])

    sent = 0
    for entry in users_data:
        u = entry.get("user", {})
        tg_id = u.get("tg_id")
        if not tg_id or u.get("is_banned"):
            continue
        try:
            await bot.send_message(
                chat_id=tg_id,
                text=text,
                parse_mode="HTML",
                reply_markup=keyboard
            )
            sent += 1
            await asyncio.sleep(0.05)  # Telegram rate limit
        except Exception as e:
            logger.warning(f"Failed to notify {tg_id}: {e}")

    logger.info(f"Match notification sent to {sent} users")


# ── App builder ────────────────────────────────────────────────────────────────

def build_app() -> Application:
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("faq", faq_command))
    app.add_handler(CommandHandler("terms", terms_command))
    app.add_handler(CommandHandler("privacy", privacy_command))
    app.add_handler(CallbackQueryHandler(button_handler))
    return app


async def run_polling():
    app = build_app()
    await app.run_polling()


if __name__ == "__main__":
    asyncio.run(run_polling())

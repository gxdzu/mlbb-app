import asyncio
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv
import os

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://your-app.vercel.app")
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    keyboard = [
        [InlineKeyboardButton(
            "🎮 Открыть MLBB Predictions",
            web_app=WebAppInfo(url=FRONTEND_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f"👋 Привет, {user.first_name}!\n\n"
        f"🏆 <b>MLBB Predictions</b> — делай прогнозы на матчи Mobile Legends и соревнуйся с другими!\n\n"
        f"📌 Как это работает:\n"
        f"• Регистрируйся и указывай никнейм в игре\n"
        f"• Делай прогнозы на матчи до их начала\n"
        f"• Зарабатывай баллы за точные прогнозы\n"
        f"• Поднимайся в таблице лидеров!\n\n"
        f"👇 Нажми кнопку чтобы начать:",
        parse_mode="HTML",
        reply_markup=reply_markup
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎯 <b>Система баллов:</b>\n\n"
        "🔫 Тотал киллов: <b>+5</b> за верный прогноз\n"
        "⏱ Длительность карты: <b>+5</b>\n"
        "🩸 Первая кровь: <b>+10</b>\n"
        "⭐ MVP карты: <b>+5</b>\n"
        "🏆 Победитель матча: <b>+1</b>\n"
        "📊 Счёт серии: динамический коэффициент × ваша ставка\n\n"
        "Удачи! 🍀",
        parse_mode="HTML"
    )


async def run_webhook():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))

    webhook_path = f"/bot/{BOT_TOKEN}"
    await app.bot.set_webhook(url=f"{WEBHOOK_URL}{webhook_path}")
    logger.info(f"Webhook set to {WEBHOOK_URL}{webhook_path}")
    return app


async def run_polling():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    await app.run_polling()


if __name__ == "__main__":
    asyncio.run(run_polling())

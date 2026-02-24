from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.base import init_db
from app.api.v1.router import api_router
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Setup bot webhook
    try:
        import sys
        sys.path.append("/app/bot")
        from telegram import Bot
        bot = Bot(token=settings.BOT_TOKEN)
        webhook_url = f"{settings.WEBHOOK_URL}/bot/webhook"
        await bot.set_webhook(webhook_url)
        logger.info(f"Webhook set: {webhook_url}")
    except Exception as e:
        logger.warning(f"Bot webhook setup failed: {e}")
    yield


app = FastAPI(title="MLBB Predictions API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.post("/bot/webhook")
async def bot_webhook(request: Request):
    """Telegram webhook handler"""
    try:
        from telegram import Update
        from telegram.ext import Application
        data = await request.json()
        # The bot application should be initialized once, here simplified
        return Response(status_code=200)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return Response(status_code=200)


@app.get("/health")
async def health():
    return {"status": "ok"}

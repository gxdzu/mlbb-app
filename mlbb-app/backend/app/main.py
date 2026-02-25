from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.base import init_db
from app.api.v1.router import api_router
from app.core.config import settings
import logging
import sys
import os

logger = logging.getLogger(__name__)

# Bot application (initialized once)
bot_app = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global bot_app
    await init_db()

    # Initialize bot
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'bot'))
        from bot import build_app
        bot_app = build_app()
        await bot_app.initialize()

        webhook_url = f"{settings.WEBHOOK_URL}/bot/webhook"
        await bot_app.bot.set_webhook(webhook_url)
        logger.info(f"Webhook set: {webhook_url}")
    except Exception as e:
        logger.warning(f"Bot init failed: {e}")

    yield

    # Shutdown bot
    if bot_app:
        try:
            await bot_app.shutdown()
        except Exception:
            pass


app = FastAPI(title="MLBB Predictions API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.post("/bot/webhook")
async def bot_webhook(request: Request):
    """Telegram webhook — passes updates to bot application."""
    global bot_app
    if not bot_app:
        return Response(status_code=200)
    try:
        from telegram import Update
        data = await request.json()
        update = Update.de_json(data, bot_app.bot)
        await bot_app.process_update(update)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    return Response(status_code=200)


@app.get("/health")
async def health():
    return {"status": "ok"}

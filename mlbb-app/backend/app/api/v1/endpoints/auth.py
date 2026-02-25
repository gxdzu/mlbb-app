from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import os
import logging
from app.db.base import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserOut
from app.core.security import verify_telegram_init_data, create_access_token

router = APIRouter()
logger = logging.getLogger(__name__)
BOT_TOKEN = os.getenv("BOT_TOKEN", "")


async def fetch_tg_photo(tg_id: int) -> str | None:
    """Get user's Telegram profile photo URL via Bot API."""
    if not BOT_TOKEN:
        return None
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            # Get user profile photos
            r = await client.get(
                f"https://api.telegram.org/bot{BOT_TOKEN}/getUserProfilePhotos",
                params={"user_id": tg_id, "limit": 1}
            )
            data = r.json()
            if not data.get("ok") or not data["result"]["total_count"]:
                return None
            file_id = data["result"]["photos"][0][-1]["file_id"]

            # Get file path
            r2 = await client.get(
                f"https://api.telegram.org/bot{BOT_TOKEN}/getFile",
                params={"file_id": file_id}
            )
            data2 = r2.json()
            if not data2.get("ok"):
                return None
            file_path = data2["result"]["file_path"]
            return f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
    except Exception as e:
        logger.warning(f"Failed to fetch TG photo for {tg_id}: {e}")
        return None


@router.post("/register", response_model=dict)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    if not data.terms_accepted:
        raise HTTPException(status_code=400, detail="Необходимо принять пользовательское соглашение")

    tg_user = verify_telegram_init_data(data.init_data)
    if not tg_user:
        raise HTTPException(status_code=401, detail="Invalid Telegram auth data")

    tg_id = tg_user["id"]
    result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = result.scalar_one_or_none()

    # Fetch photo from Bot API (more reliable than initData)
    photo_url = await fetch_tg_photo(tg_id)

    if not user:
        user = User(
            tg_id=tg_id,
            tg_username=tg_user.get("username"),
            first_name=tg_user.get("first_name", "Player"),
            tg_photo_url=photo_url,
            game_nickname=data.game_nickname,
            game_id=data.game_id,
            terms_accepted=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        if user.is_banned:
            raise HTTPException(status_code=403, detail="Аккаунт заблокирован")
        user.game_nickname = data.game_nickname
        user.game_id = data.game_id
        if photo_url:
            user.tg_photo_url = photo_url
        await db.commit()

    token = create_access_token({"sub": str(user.tg_id)})
    return {"access_token": token, "token_type": "bearer", "user": UserOut.model_validate(user).model_dump()}


@router.post("/login", response_model=dict)
async def login(data: dict, db: AsyncSession = Depends(get_db)):
    init_data = data.get("init_data", "")
    tg_user = verify_telegram_init_data(init_data)
    if not tg_user:
        raise HTTPException(status_code=401, detail="Invalid auth")

    result = await db.execute(select(User).where(User.tg_id == tg_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not registered")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

    # Refresh photo on every login
    photo_url = await fetch_tg_photo(tg_user["id"])
    if photo_url and photo_url != user.tg_photo_url:
        user.tg_photo_url = photo_url
        await db.commit()

    token = create_access_token({"sub": str(user.tg_id)})
    return {"access_token": token, "token_type": "bearer", "user": UserOut.model_validate(user).model_dump()}

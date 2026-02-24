from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.base import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserOut
from app.core.security import verify_telegram_init_data, create_access_token

router = APIRouter()


@router.post("/register", response_model=dict)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    tg_user = verify_telegram_init_data(data.init_data)
    if not tg_user:
        raise HTTPException(status_code=401, detail="Invalid Telegram auth data")

    tg_id = tg_user["id"]
    result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            tg_id=tg_id,
            tg_username=tg_user.get("username"),
            first_name=tg_user.get("first_name", "Player"),
            game_nickname=data.game_nickname,
            game_id=data.game_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update nickname/id if provided again
        user.game_nickname = data.game_nickname
        user.game_id = data.game_id
        await db.commit()

    token = create_access_token({"sub": str(user.tg_id)})
    return {"access_token": token, "token_type": "bearer", "user": UserOut.model_validate(user).model_dump()}


@router.post("/login", response_model=dict)
async def login(data: dict, db: AsyncSession = Depends(get_db)):
    """Login via initData (for returning users)"""
    init_data = data.get("init_data", "")
    tg_user = verify_telegram_init_data(init_data)
    if not tg_user:
        raise HTTPException(status_code=401, detail="Invalid auth")

    result = await db.execute(select(User).where(User.tg_id == tg_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not registered")

    token = create_access_token({"sub": str(user.tg_id)})
    return {"access_token": token, "token_type": "bearer", "user": UserOut.model_validate(user).model_dump()}

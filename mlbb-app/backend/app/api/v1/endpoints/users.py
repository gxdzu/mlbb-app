from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.db.base import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.api.v1.endpoints.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/leaderboard", response_model=List[dict])
async def get_leaderboard(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .where(User.is_active == True)
        .order_by(desc(User.points))
        .limit(limit)
    )
    users = result.scalars().all()
    return [
        {
            "rank": idx + 1,
            "user": UserOut.model_validate(u).model_dump()
        }
        for idx, u in enumerate(users)
    ]


@router.get("/me/rank", response_model=dict)
async def get_my_rank(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User)
        .where(User.is_active == True, User.points > current_user.points)
    )
    rank = len(result.scalars().all()) + 1
    return {"rank": rank, "user": UserOut.model_validate(current_user).model_dump()}

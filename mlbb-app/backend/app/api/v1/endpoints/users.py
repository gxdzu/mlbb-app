from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List
from app.db.base import get_db
from app.models.user import User
from app.models.prediction import Prediction
from app.models.match import Match
from app.schemas.user import UserOut
from app.api.v1.endpoints.deps import get_current_user, get_admin

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/leaderboard", response_model=List[dict])
async def get_leaderboard(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .where(User.is_active == True, User.is_banned == False)
        .order_by(desc(User.points))
        .limit(limit)
    )
    users = result.scalars().all()
    return [{"rank": idx + 1, "user": UserOut.model_validate(u).model_dump()}
            for idx, u in enumerate(users)]


@router.get("/leaderboard/tournament/{tournament_id}", response_model=List[dict])
async def get_tournament_leaderboard(
    tournament_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    rows_result = await db.execute(
        select(
            Prediction.user_id,
            func.sum(Prediction.points_earned).label("tp"),
            func.count(Prediction.id).label("cnt"),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(Match.tournament_id == tournament_id, Prediction.is_settled == True)
        .group_by(Prediction.user_id)
        .order_by(desc("tp"))
        .limit(limit)
    )
    rows = rows_result.all()
    if not rows:
        return []

    user_ids = [r.user_id for r in rows]
    users_result = await db.execute(
        select(User).where(User.id.in_(user_ids), User.is_banned == False)
    )
    users_map = {u.id: u for u in users_result.scalars().all()}

    out = []
    for idx, row in enumerate(rows):
        u = users_map.get(row.user_id)
        if not u:
            continue
        out.append({
            "rank": idx + 1,
            "tournament_points": int(row.tp or 0),
            "tournament_predictions": int(row.cnt or 0),
            "user": UserOut.model_validate(u).model_dump(),
        })
    return out


@router.get("/me/rank", response_model=dict)
async def get_my_rank(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.is_active == True, User.is_banned == False, User.points > current_user.points)
    )
    rank = len(result.scalars().all()) + 1
    return {"rank": rank, "user": UserOut.model_validate(current_user).model_dump()}


@router.get("/me/rank/tournament/{tournament_id}", response_model=dict)
async def get_my_tournament_rank(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    my_pts_result = await db.execute(
        select(func.sum(Prediction.points_earned))
        .join(Match, Match.id == Prediction.match_id)
        .where(
            Match.tournament_id == tournament_id,
            Prediction.user_id == current_user.id,
            Prediction.is_settled == True,
        )
    )
    my_points = int(my_pts_result.scalar() or 0)

    subq = (
        select(func.sum(Prediction.points_earned).label("tp"))
        .join(Match, Match.id == Prediction.match_id)
        .where(Match.tournament_id == tournament_id, Prediction.is_settled == True)
        .group_by(Prediction.user_id)
        .having(func.sum(Prediction.points_earned) > my_points)
        .subquery()
    )
    ahead_result = await db.execute(select(func.count()).select_from(subq))
    rank = int(ahead_result.scalar() or 0) + 1

    return {
        "rank": rank,
        "tournament_points": my_points,
        "user": UserOut.model_validate(current_user).model_dump(),
    }


# ── Admin ──────────────────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[dict], dependencies=[Depends(get_admin)])
async def get_all_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(desc(User.points)))
    users = result.scalars().all()
    return [{"rank": idx + 1, "user": UserOut.model_validate(u).model_dump()}
            for idx, u in enumerate(users)]


@router.post("/admin/{user_id}/ban", dependencies=[Depends(get_admin)])
async def ban_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.is_banned = True
    await db.commit()
    return {"ok": True}


@router.post("/admin/{user_id}/unban", dependencies=[Depends(get_admin)])
async def unban_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.is_banned = False
    await db.commit()
    return {"ok": True}


@router.post("/admin/reset-points", dependencies=[Depends(get_admin)])
async def reset_all_points(db: AsyncSession = Depends(get_db)):
    """Reset all users' points, predictions count and accuracy to zero."""
    result = await db.execute(select(User))
    users = result.scalars().all()
    for u in users:
        u.points = 0
        u.total_predictions = 0
        u.correct_predictions = 0
        u.accuracy = 0.0
    await db.commit()
    return {"ok": True, "reset_count": len(users)}


@router.post("/broadcast", dependencies=[Depends(get_admin)])
async def broadcast_message(data: dict, db: AsyncSession = Depends(get_db)):
    """Send a message to all active non-banned users via Telegram bot."""
    import os, asyncio, logging
    logger = logging.getLogger(__name__)
    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Текст не может быть пустым")

    result = await db.execute(
        select(User).where(User.is_active == True, User.is_banned == False)
    )
    users = result.scalars().all()

    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        raise HTTPException(status_code=500, detail="BOT_TOKEN не настроен")

    import httpx
    sent = 0
    failed = 0
    async with httpx.AsyncClient(timeout=10) as client:
        for u in users:
            try:
                r = await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": u.tg_id, "text": text, "parse_mode": "HTML"},
                )
                if r.json().get("ok"):
                    sent += 1
                else:
                    failed += 1
            except Exception as e:
                logger.warning(f"Broadcast failed for {u.tg_id}: {e}")
                failed += 1
            await asyncio.sleep(0.05)

    return {"sent": sent, "failed": failed}

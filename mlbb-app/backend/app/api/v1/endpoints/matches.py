from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone
from app.db.base import get_db
from app.models.match import Match, MatchStatus
from app.schemas.match import MatchCreate, MatchUpdate, MatchResultSubmit, MatchOut
from app.api.v1.endpoints.deps import get_admin
from app.services.prediction_service import settle_match_predictions

router = APIRouter()


def strip_tz(dt: Optional[datetime]) -> Optional[datetime]:
    """Remove timezone info to store as naive UTC datetime"""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


@router.get("/", response_model=List[MatchOut])
async def get_matches(
    tournament_id: Optional[int] = None,
    status: Optional[MatchStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(Match).order_by(Match.scheduled_at)
    if tournament_id:
        q = q.where(Match.tournament_id == tournament_id)
    if status:
        q = q.where(Match.status == status)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{match_id}", response_model=MatchOut)
async def get_match(match_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    return m


@router.post("/", response_model=MatchOut, dependencies=[Depends(get_admin)])
async def create_match(data: MatchCreate, db: AsyncSession = Depends(get_db)):
    m = Match(
        tournament_id=data.tournament_id,
        team1_name=data.team1_name,
        team2_name=data.team2_name,
        team1_logo=data.team1_logo,
        team2_logo=data.team2_logo,
        series_type=data.series_type,
        scheduled_at=strip_tz(data.scheduled_at),
        predictions_close_at=strip_tz(data.predictions_close_at),
        team1_players=data.team1_players,
        team2_players=data.team2_players,
        kills_options=data.kills_options,
        duration_options=data.duration_options,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)

    # Send Telegram notification to all users
    import asyncio
    from app.core.config import settings
    try:
        from telegram import Bot
        bot = Bot(token=settings.BOT_TOKEN)
        from bot.bot import notify_match_created
        asyncio.create_task(notify_match_created(bot, {
            "team1_name": m.team1_name,
            "team2_name": m.team2_name,
            "series_type": m.series_type.value,
        }))
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Notification failed: {e}")

    return m


@router.put("/{match_id}", response_model=MatchOut, dependencies=[Depends(get_admin)])
async def update_match(match_id: int, data: MatchUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    update_data = data.model_dump(exclude_unset=True)
    # Strip timezone from datetime fields
    for field in ('scheduled_at', 'predictions_close_at'):
        if field in update_data and update_data[field] is not None:
            update_data[field] = strip_tz(update_data[field])
    for k, v in update_data.items():
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return m


@router.post("/{match_id}/results", response_model=dict, dependencies=[Depends(get_admin)])
async def submit_results(match_id: int, data: MatchResultSubmit, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    if m.results_processed:
        raise HTTPException(status_code=400, detail="Results already processed")
    for k, v in data.model_dump().items():
        setattr(m, k, v)
    m.status = MatchStatus.finished
    settled = await settle_match_predictions(db, m)
    return {"ok": True, "settled_predictions": settled}


@router.delete("/{match_id}", dependencies=[Depends(get_admin)])
async def delete_match(match_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    # Delete related predictions first to avoid FK constraint violation
    from app.models.prediction import Prediction
    from sqlalchemy import delete as sql_delete
    await db.execute(sql_delete(Prediction).where(Prediction.match_id == match_id))
    await db.delete(m)
    await db.commit()
    return {"ok": True}

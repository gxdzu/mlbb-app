from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.db.base import get_db
from app.models.match import Match, MatchStatus
from app.schemas.match import MatchCreate, MatchUpdate, MatchResultSubmit, MatchOut
from app.api.v1.endpoints.deps import get_admin
from app.services.prediction_service import settle_match_predictions

router = APIRouter()


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


# Admin routes
@router.post("/", response_model=MatchOut, dependencies=[Depends(get_admin)])
async def create_match(data: MatchCreate, db: AsyncSession = Depends(get_db)):
    m = Match(**data.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.put("/{match_id}", response_model=MatchOut, dependencies=[Depends(get_admin)])
async def update_match(match_id: int, data: MatchUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
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
    await db.delete(m)
    await db.commit()
    return {"ok": True}

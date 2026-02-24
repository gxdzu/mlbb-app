from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.base import get_db
from app.models.tournament import Tournament
from app.schemas.tournament import TournamentCreate, TournamentUpdate, TournamentOut
from app.api.v1.endpoints.deps import get_admin

router = APIRouter()


@router.get("/", response_model=List[TournamentOut])
async def get_tournaments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tournament).order_by(Tournament.created_at.desc()))
    return result.scalars().all()


@router.get("/{tournament_id}", response_model=TournamentOut)
async def get_tournament(tournament_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return t


# Admin routes
@router.post("/", response_model=TournamentOut, dependencies=[Depends(get_admin)])
async def create_tournament(data: TournamentCreate, db: AsyncSession = Depends(get_db)):
    t = Tournament(**data.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


@router.put("/{tournament_id}", response_model=TournamentOut, dependencies=[Depends(get_admin)])
async def update_tournament(tournament_id: int, data: TournamentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return t


@router.delete("/{tournament_id}", dependencies=[Depends(get_admin)])
async def delete_tournament(tournament_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(t)
    await db.commit()
    return {"ok": True}

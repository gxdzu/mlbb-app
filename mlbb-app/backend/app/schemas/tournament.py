from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
from app.models.tournament import TournamentStatus


class TournamentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    status: TournamentStatus = TournamentStatus.upcoming
    bracket_data: Optional[Any] = None
    prize_pool: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TournamentUpdate(TournamentCreate):
    pass


class TournamentOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    logo_url: Optional[str]
    status: TournamentStatus
    bracket_data: Optional[Any]
    prize_pool: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

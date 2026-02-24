from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.db.base import Base


class TournamentStatus(str, enum.Enum):
    upcoming = "upcoming"
    live = "live"
    finished = "finished"


class Tournament(Base):
    __tablename__ = "tournaments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[TournamentStatus] = mapped_column(SAEnum(TournamentStatus), default=TournamentStatus.upcoming)
    bracket_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # bracket/grid JSON
    prize_pool: Mapped[str | None] = mapped_column(String(64), nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

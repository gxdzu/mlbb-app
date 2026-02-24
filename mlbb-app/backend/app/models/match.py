from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.db.base import Base


class MatchStatus(str, enum.Enum):
    upcoming = "upcoming"
    live = "live"
    finished = "finished"
    cancelled = "cancelled"


class SeriesType(str, enum.Enum):
    bo1 = "bo1"
    bo3 = "bo3"
    bo5 = "bo5"
    bo7 = "bo7"


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tournament_id: Mapped[int] = mapped_column(Integer, ForeignKey("tournaments.id"))
    team1_name: Mapped[str] = mapped_column(String(64))
    team2_name: Mapped[str] = mapped_column(String(64))
    team1_logo: Mapped[str | None] = mapped_column(String(512), nullable=True)
    team2_logo: Mapped[str | None] = mapped_column(String(512), nullable=True)
    series_type: Mapped[SeriesType] = mapped_column(SAEnum(SeriesType), default=SeriesType.bo3)
    status: Mapped[MatchStatus] = mapped_column(SAEnum(MatchStatus), default=MatchStatus.upcoming)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    predictions_close_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # deadline
    
    # Rosters for first blood / MVP predictions
    team1_players: Mapped[list | None] = mapped_column(JSON, nullable=True)  # ["Player1", "Player2", ...]
    team2_players: Mapped[list | None] = mapped_column(JSON, nullable=True)
    
    # Prediction options (admin sets these)
    kills_options: Mapped[list | None] = mapped_column(JSON, nullable=True)  # ["<200", "200-250", ">250"]
    duration_options: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Results (filled by admin after match)
    result_winner: Mapped[str | None] = mapped_column(String(64), nullable=True)
    result_score: Mapped[str | None] = mapped_column(String(16), nullable=True)  # "2-1"
    result_kills_total: Mapped[str | None] = mapped_column(String(32), nullable=True)
    result_duration: Mapped[str | None] = mapped_column(String(32), nullable=True)
    result_first_blood: Mapped[str | None] = mapped_column(String(64), nullable=True)
    result_mvp: Mapped[str | None] = mapped_column(String(64), nullable=True)
    results_processed: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

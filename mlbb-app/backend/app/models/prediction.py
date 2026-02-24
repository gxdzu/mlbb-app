from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Float, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.db.base import Base


class PredictionType(str, enum.Enum):
    kills_total = "kills_total"       # +5 / 0
    map_duration = "map_duration"     # +5 / 0
    first_blood = "first_blood"       # +10 / 0
    mvp = "mvp"                       # +5 / 0
    winner = "winner"                 # +1 / 0
    series_score = "series_score"     # dynamic coefficient


FIXED_POINTS = {
    PredictionType.kills_total: 5,
    PredictionType.map_duration: 5,
    PredictionType.first_blood: 10,
    PredictionType.mvp: 5,
    PredictionType.winner: 1,
}

# Series score coefficients by series type and score
SERIES_COEFFICIENTS = {
    "bo3": {"2-0": 1.5, "0-2": 1.5, "2-1": 2.0, "1-2": 2.0},
    "bo5": {"3-0": 2.5, "0-3": 2.5, "3-1": 2.0, "1-3": 2.0, "3-2": 1.5, "2-3": 1.5},
    "bo7": {"4-0": 3.0, "0-4": 3.0, "4-1": 2.5, "1-4": 2.5, "4-2": 2.0, "2-4": 2.0, "4-3": 1.5, "3-4": 1.5},
}


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id"))
    pred_type: Mapped[PredictionType] = mapped_column(SAEnum(PredictionType))
    pred_value: Mapped[str] = mapped_column(String(128))  # the user's chosen answer

    # For series_score - dynamic bet
    points_wagered: Mapped[int] = mapped_column(Integer, default=0)
    coefficient: Mapped[float] = mapped_column(Float, default=1.0)

    points_earned: Mapped[int] = mapped_column(Integer, default=0)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)  # None = pending
    is_settled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

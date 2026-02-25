from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Float, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.db.base import Base


class PredictionType(str, enum.Enum):
    kills_total = "kills_total"         # +5 / 0  — тотал киллов матча
    map_duration = "map_duration"       # +5 / 0  — длительность (средняя по матчу)
    first_blood_1 = "first_blood_1"     # +10 / 0 — первая кровь карты 1
    first_blood_2 = "first_blood_2"     # +10 / 0 — первая кровь карты 2
    first_blood_3 = "first_blood_3"     # +10 / 0 — первая кровь карты 3
    first_blood_4 = "first_blood_4"     # +10 / 0 — первая кровь карты 4
    first_blood_5 = "first_blood_5"     # +10 / 0 — первая кровь карты 5
    mvp_1 = "mvp_1"                     # +5 / 0  — mvp карты 1
    mvp_2 = "mvp_2"                     # +5 / 0  — mvp карты 2
    mvp_3 = "mvp_3"                     # +5 / 0  — mvp карты 3
    mvp_4 = "mvp_4"                     # +5 / 0  — mvp карты 4
    mvp_5 = "mvp_5"                     # +5 / 0  — mvp карты 5
    winner = "winner"                   # +1 / 0  — победитель матча
    series_score = "series_score"       # dynamic — счёт серии


FIXED_POINTS = {
    PredictionType.kills_total: 5,
    PredictionType.map_duration: 5,
    PredictionType.first_blood_1: 10,
    PredictionType.first_blood_2: 10,
    PredictionType.first_blood_3: 10,
    PredictionType.first_blood_4: 10,
    PredictionType.first_blood_5: 10,
    PredictionType.mvp_1: 5,
    PredictionType.mvp_2: 5,
    PredictionType.mvp_3: 5,
    PredictionType.mvp_4: 5,
    PredictionType.mvp_5: 5,
    PredictionType.winner: 1,
}

# How many maps per series type (max maps that can be played)
SERIES_MAP_COUNT = {
    "bo1": 1,
    "bo3": 2,  # минимум карт (2-0)
    "bo5": 3,  # минимум карт (3-0)
    "bo7": 4,  # минимум карт (4-0)
}

# Series score coefficients
SERIES_COEFFICIENTS = {
    "bo3": {"2-0": 1.5, "0-2": 1.5, "2-1": 2.0, "1-2": 2.0},
    "bo5": {"3-0": 2.5, "0-3": 2.5, "3-1": 2.0, "1-3": 2.0, "3-2": 1.5, "2-3": 1.5},
    "bo7": {"4-0": 3.0, "0-4": 3.0, "4-1": 2.5, "1-4": 2.5, "4-2": 2.0, "2-4": 2.0, "4-3": 1.5, "3-4": 1.5},
}

FIRST_BLOOD_TYPES = [
    PredictionType.first_blood_1,
    PredictionType.first_blood_2,
    PredictionType.first_blood_3,
    PredictionType.first_blood_4,
    PredictionType.first_blood_5,
]

MVP_TYPES = [
    PredictionType.mvp_1,
    PredictionType.mvp_2,
    PredictionType.mvp_3,
    PredictionType.mvp_4,
    PredictionType.mvp_5,
]


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id"))
    pred_type: Mapped[PredictionType] = mapped_column(SAEnum(PredictionType))
    pred_value: Mapped[str] = mapped_column(String(128))

    # For series_score - dynamic bet
    points_wagered: Mapped[int] = mapped_column(Integer, default=0)
    coefficient: Mapped[float] = mapped_column(Float, default=1.0)

    points_earned: Mapped[int] = mapped_column(Integer, default=0)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_settled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

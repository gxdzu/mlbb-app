from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.prediction import PredictionType


class PredictionCreate(BaseModel):
    match_id: int
    pred_type: PredictionType
    pred_value: str
    points_wagered: int = 0  # only for series_score type


class PredictionOut(BaseModel):
    id: int
    match_id: int
    pred_type: PredictionType
    pred_value: str
    points_wagered: int
    coefficient: float
    points_earned: int
    is_correct: Optional[bool]
    is_settled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserStatsOut(BaseModel):
    points: int
    total_predictions: int
    correct_predictions: int
    accuracy: float
    points_from_kills: int
    points_from_duration: int
    points_from_first_blood: int
    points_from_mvp: int
    points_from_winner: int
    points_from_series: int

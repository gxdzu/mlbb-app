from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
from app.models.match import MatchStatus, SeriesType


class MatchCreate(BaseModel):
    tournament_id: int
    team1_name: str
    team2_name: str
    team1_logo: Optional[str] = None
    team2_logo: Optional[str] = None
    series_type: SeriesType = SeriesType.bo3
    scheduled_at: datetime
    predictions_close_at: Optional[datetime] = None
    team1_players: Optional[List[str]] = None
    team2_players: Optional[List[str]] = None
    kills_options: Optional[List[str]] = None
    duration_options: Optional[List[str]] = None


class MatchUpdate(BaseModel):
    status: Optional[MatchStatus] = None
    team1_name: Optional[str] = None
    team2_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    predictions_close_at: Optional[datetime] = None
    team1_players: Optional[List[str]] = None
    team2_players: Optional[List[str]] = None
    kills_options: Optional[List[str]] = None
    duration_options: Optional[List[str]] = None


class MatchResultSubmit(BaseModel):
    result_winner: str
    result_score: str
    result_kills_total: Optional[str] = None
    result_duration: Optional[str] = None
    # Per-map: list indexed by map number (index 0 = map 1)
    result_first_blood: Optional[List[Optional[str]]] = None  # e.g. ["Kairi", "Sanz", "Hoshi"]
    result_mvp: Optional[List[Optional[str]]] = None          # e.g. ["Hoshi", "Kairi", None]


class MatchOut(BaseModel):
    id: int
    tournament_id: int
    team1_name: str
    team2_name: str
    team1_logo: Optional[str]
    team2_logo: Optional[str]
    series_type: SeriesType
    status: MatchStatus
    scheduled_at: datetime
    predictions_close_at: Optional[datetime]
    team1_players: Optional[List[str]]
    team2_players: Optional[List[str]]
    kills_options: Optional[List[str]]
    duration_options: Optional[List[str]]
    result_winner: Optional[str]
    result_score: Optional[str]
    result_kills_total: Optional[str]
    result_duration: Optional[str]
    result_first_blood: Optional[List[Optional[str]]]
    result_mvp: Optional[List[Optional[str]]]
    results_processed: bool
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.strftime('%Y-%m-%dT%H:%M:%S') + 'Z'
        }

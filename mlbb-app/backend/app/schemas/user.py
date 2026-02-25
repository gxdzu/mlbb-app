from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    init_data: str
    game_nickname: str
    game_id: str
    terms_accepted: bool
    tg_photo_url: Optional[str] = None


class UserOut(BaseModel):
    id: int
    tg_id: int
    tg_username: Optional[str]
    first_name: str
    tg_photo_url: Optional[str]
    game_nickname: str
    game_id: str
    points: int
    total_predictions: int
    correct_predictions: int
    accuracy: float
    is_banned: bool
    terms_accepted: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserRank(BaseModel):
    rank: int
    user: UserOut

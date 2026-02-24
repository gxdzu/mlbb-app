from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    init_data: str  # Telegram initData
    game_nickname: str
    game_id: str


class UserOut(BaseModel):
    id: int
    tg_id: int
    tg_username: Optional[str]
    first_name: str
    game_nickname: str
    game_id: str
    points: int
    total_predictions: int
    correct_predictions: int
    accuracy: float
    created_at: datetime

    class Config:
        from_attributes = True


class UserRank(BaseModel):
    rank: int
    user: UserOut

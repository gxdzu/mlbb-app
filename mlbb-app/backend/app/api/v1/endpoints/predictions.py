from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime
from app.db.base import get_db
from app.models.prediction import Prediction, PredictionType, SERIES_COEFFICIENTS
from app.models.match import Match, MatchStatus
from app.models.user import User
from app.schemas.prediction import PredictionCreate, PredictionOut, UserStatsOut
from app.api.v1.endpoints.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=PredictionOut)
async def create_prediction(
    data: PredictionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check match exists and is upcoming
    result = await db.execute(select(Match).where(Match.id == data.match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status != MatchStatus.upcoming:
        raise HTTPException(status_code=400, detail="Predictions closed for this match")
    
    # Check prediction deadline
    if match.predictions_close_at and datetime.utcnow() > match.predictions_close_at:
        raise HTTPException(status_code=400, detail="Prediction deadline passed")

    # Check no duplicate prediction for same type
    existing = await db.execute(
        select(Prediction).where(
            Prediction.user_id == current_user.id,
            Prediction.match_id == data.match_id,
            Prediction.pred_type == data.pred_type
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already predicted this category")

    # Validate series score bet
    coefficient = 1.0
    if data.pred_type == PredictionType.series_score:
        if data.points_wagered <= 0:
            raise HTTPException(status_code=400, detail="Must wager points for series score")
        if data.points_wagered > current_user.points:
            raise HTTPException(status_code=400, detail="Insufficient points")
        coefs = SERIES_COEFFICIENTS.get(match.series_type.value, {})
        coefficient = coefs.get(data.pred_value, 1.5)
        # Deduct wagered points immediately (held)
        current_user.points -= data.points_wagered

    pred = Prediction(
        user_id=current_user.id,
        match_id=data.match_id,
        pred_type=data.pred_type,
        pred_value=data.pred_value,
        points_wagered=data.points_wagered,
        coefficient=coefficient,
    )
    db.add(pred)
    await db.commit()
    await db.refresh(pred)
    return pred


@router.get("/my", response_model=List[PredictionOut])
async def get_my_predictions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Prediction)
        .where(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
    )
    return result.scalars().all()


@router.get("/my/stats", response_model=UserStatsOut)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Prediction).where(
            Prediction.user_id == current_user.id,
            Prediction.is_settled == True
        )
    )
    preds = result.scalars().all()

    stats = {
        "points": current_user.points,
        "total_predictions": current_user.total_predictions,
        "correct_predictions": current_user.correct_predictions,
        "accuracy": current_user.accuracy,
        "points_from_kills": 0,
        "points_from_duration": 0,
        "points_from_first_blood": 0,
        "points_from_mvp": 0,
        "points_from_winner": 0,
        "points_from_series": 0,
    }
    type_map = {
        PredictionType.kills_total: "points_from_kills",
        PredictionType.map_duration: "points_from_duration",
        PredictionType.first_blood: "points_from_first_blood",
        PredictionType.mvp: "points_from_mvp",
        PredictionType.winner: "points_from_winner",
        PredictionType.series_score: "points_from_series",
    }
    for p in preds:
        key = type_map.get(p.pred_type)
        if key:
            stats[key] += p.points_earned

    return stats


@router.get("/match/{match_id}/my", response_model=List[PredictionOut])
async def get_my_match_predictions(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Prediction).where(
            Prediction.user_id == current_user.id,
            Prediction.match_id == match_id
        )
    )
    return result.scalars().all()

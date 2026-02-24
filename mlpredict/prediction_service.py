from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.prediction import Prediction, PredictionType, FIXED_POINTS, SERIES_COEFFICIENTS
from app.models.match import Match
from app.models.user import User


async def settle_match_predictions(db: AsyncSession, match: Match) -> int:
    """Process all predictions for a match and award points. Returns total predictions settled."""
    result = await db.execute(
        select(Prediction).where(
            Prediction.match_id == match.id,
            Prediction.is_settled == False
        )
    )
    predictions = result.scalars().all()
    settled_count = 0

    for pred in predictions:
        correct = False
        points = 0

        if pred.pred_type == PredictionType.kills_total:
            correct = pred.pred_value == match.result_kills_total
            points = FIXED_POINTS[PredictionType.kills_total] if correct else 0

        elif pred.pred_type == PredictionType.map_duration:
            correct = pred.pred_value == match.result_duration
            points = FIXED_POINTS[PredictionType.map_duration] if correct else 0

        elif pred.pred_type == PredictionType.first_blood:
            correct = pred.pred_value == match.result_first_blood
            points = FIXED_POINTS[PredictionType.first_blood] if correct else 0

        elif pred.pred_type == PredictionType.mvp:
            correct = pred.pred_value == match.result_mvp
            points = FIXED_POINTS[PredictionType.mvp] if correct else 0

        elif pred.pred_type == PredictionType.winner:
            correct = pred.pred_value == match.result_winner
            points = FIXED_POINTS[PredictionType.winner] if correct else 0

        elif pred.pred_type == PredictionType.series_score:
            correct = pred.pred_value == match.result_score
            if correct:
                coef = SERIES_COEFFICIENTS.get(match.series_type.value, {}).get(pred.pred_value, 1.5)
                points = int(pred.points_wagered * coef)
            else:
                # Wagered points are returned as 0 (lost)
                points = 0

        pred.is_correct = correct
        pred.points_earned = points
        pred.is_settled = True
        settled_count += 1

        # Update user stats
        user_result = await db.execute(select(User).where(User.id == pred.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user.points += points
            user.total_predictions += 1
            if correct:
                user.correct_predictions += 1

    match.results_processed = True
    await db.commit()
    return settled_count

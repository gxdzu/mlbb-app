from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.prediction import Prediction, PredictionType, FIXED_POINTS, SERIES_COEFFICIENTS, FIRST_BLOOD_TYPES, MVP_TYPES
from app.models.match import Match


async def settle_match_predictions(db: AsyncSession, match: Match) -> int:
    """
    Settle all predictions for a finished match.
    Returns number of settled predictions.
    """
    result = await db.execute(
        select(Prediction).where(
            Prediction.match_id == match.id,
            Prediction.is_settled == False
        )
    )
    predictions = result.scalars().all()

    # Per-map first_blood and mvp results (lists, index = map_number - 1)
    fb_results = match.result_first_blood or []
    mvp_results = match.result_mvp or []

    settled = 0
    for p in predictions:
        correct = False
        points = 0

        if p.pred_type == PredictionType.kills_total:
            correct = p.pred_value == match.result_kills_total

        elif p.pred_type == PredictionType.map_duration:
            correct = p.pred_value == match.result_duration

        elif p.pred_type == PredictionType.winner:
            correct = p.pred_value == match.result_winner

        elif p.pred_type == PredictionType.series_score:
            correct = p.pred_value == match.result_score
            if correct:
                coeff = SERIES_COEFFICIENTS.get(match.series_type, {}).get(match.result_score, 1.0)
                points = int(p.points_wagered * coeff)

        elif p.pred_type in FIRST_BLOOD_TYPES:
            # first_blood_1 -> index 0, first_blood_2 -> index 1, etc.
            map_idx = FIRST_BLOOD_TYPES.index(p.pred_type)
            if map_idx < len(fb_results) and fb_results[map_idx]:
                correct = p.pred_value == fb_results[map_idx]

        elif p.pred_type in MVP_TYPES:
            map_idx = MVP_TYPES.index(p.pred_type)
            if map_idx < len(mvp_results) and mvp_results[map_idx]:
                correct = p.pred_value == mvp_results[map_idx]

        # Fixed points for non-series types
        if p.pred_type != PredictionType.series_score:
            points = FIXED_POINTS.get(p.pred_type, 0) if correct else 0

        p.is_correct = correct
        p.points_earned = points
        p.is_settled = True

        # Update user points
        from app.models.user import User
        user_result = await db.execute(select(User).where(User.id == p.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user.points += points
            user.total_predictions += 1
            if correct:
                user.correct_predictions += 1
            if user.total_predictions > 0:
                user.accuracy = round(user.correct_predictions / user.total_predictions * 100, 1)

        settled += 1

    match.results_processed = True
    await db.commit()
    return settled

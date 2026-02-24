import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { matchesApi, predictionsApi } from '../api/client'
import useStore from '../store/useStore'

const PRED_TYPES = [
  { key: 'kills_total', label: '🔫 Тотал киллов', points: 5 },
  { key: 'map_duration', label: '⏱ Длительность карты', points: 5 },
  { key: 'first_blood', label: '🩸 Первая кровь', points: 10, special: 'players' },
  { key: 'mvp', label: '⭐ MVP карты', points: 5, special: 'players' },
  { key: 'winner', label: '🏆 Победитель', points: 1, special: 'teams' },
  { key: 'series_score', label: '📊 Счёт серии', dynamic: true },
]

const SERIES_COEFS = {
  bo3: { '2-0': 1.5, '0-2': 1.5, '2-1': 2.0, '1-2': 2.0 },
  bo5: { '3-0': 2.5, '0-3': 2.5, '3-1': 2.0, '1-3': 2.0, '3-2': 1.5, '2-3': 1.5 },
  bo7: { '4-0': 3.0, '0-4': 3.0, '4-1': 2.5, '1-4': 2.5, '4-2': 2.0, '2-4': 2.0, '4-3': 1.5, '3-4': 1.5 },
}

export default function MatchDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, setUser } = useStore()
  const [match, setMatch] = useState(null)
  const [myPreds, setMyPreds] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState({})
  const [wagers, setWagers] = useState({})
  const [submitting, setSubmitting] = useState({})
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState({})

  useEffect(() => {
    Promise.all([
      matchesApi.getOne(id),
      matchesApi.getMyPredictions(id)
    ]).then(([m, p]) => {
      setMatch(m.data)
      setMyPreds(p.data)
    }).finally(() => setLoading(false))
  }, [id])

  const alreadyPredicted = (type) => myPreds.some(p => p.pred_type === type)

  const getOptions = (type) => {
    if (!match) return []
    if (type === 'kills_total') return match.kills_options || []
    if (type === 'map_duration') return match.duration_options || []
    if (type === 'first_blood' || type === 'mvp') {
      return [...(match.team1_players || []), ...(match.team2_players || [])]
    }
    if (type === 'winner') return [match.team1_name, match.team2_name]
    if (type === 'series_score') return Object.keys(SERIES_COEFS[match.series_type] || {})
    return []
  }

  const submitPrediction = async (type) => {
    const value = selected[type]
    if (!value) return
    setSubmitting(s => ({ ...s, [type]: true }))
    setErrors(e => ({ ...e, [type]: null }))
    try {
      await predictionsApi.create({
        match_id: parseInt(id),
        pred_type: type,
        pred_value: value,
        points_wagered: type === 'series_score' ? parseInt(wagers[type] || 0) : 0,
      })
      setSuccess(s => ({ ...s, [type]: true }))
      setMyPreds(p => [...p, { pred_type: type, pred_value: value, is_settled: false }])
    } catch (e) {
      setErrors(er => ({ ...er, [type]: e.response?.data?.detail || 'Ошибка' }))
    } finally {
      setSubmitting(s => ({ ...s, [type]: false }))
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" /></div>
  if (!match) return <div className="p-4 text-center text-gray-400">Матч не найден</div>

  const isPredOpen = match.status === 'upcoming' && (!match.predictions_close_at || new Date() < new Date(match.predictions_close_at))

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => navigate(-1)} className="text-gray-400 text-sm flex items-center gap-1">
        ← Назад
      </button>

      {/* Match header */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
        <div className="flex items-center justify-center gap-4">
          <div className="text-center flex-1">
            <div className="font-display text-xl font-bold">{match.team1_name}</div>
          </div>
          <div className="text-center px-2">
            <div className="font-display text-[#f59e0b] font-bold">{match.series_type.toUpperCase()}</div>
            {match.status === 'finished' && match.result_score && (
              <div className="font-display text-2xl font-bold mt-1">{match.result_score}</div>
            )}
            {match.status === 'live' && <div className="text-red-400 text-sm font-bold animate-pulse">● LIVE</div>}
          </div>
          <div className="text-center flex-1">
            <div className="font-display text-xl font-bold">{match.team2_name}</div>
          </div>
        </div>
      </div>

      {/* Predictions */}
      {!isPredOpen && match.status === 'upcoming' && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl px-4 py-2 text-yellow-400 text-sm text-center">
          ⏰ Приём прогнозов закрыт
        </div>
      )}

      {match.status === 'finished' && (
        <div className="bg-green-900/20 border border-green-700 rounded-xl px-4 py-2 text-green-400 text-sm text-center">
          ✅ Матч завершён — прогнозы посчитаны
        </div>
      )}

      <div className="space-y-3">
        {PRED_TYPES.map(pt => {
          const options = getOptions(pt.key)
          if (options.length === 0) return null
          const done = alreadyPredicted(pt.key)
          const myPred = myPreds.find(p => p.pred_type === pt.key)
          const coefs = pt.key === 'series_score' ? (SERIES_COEFS[match.series_type] || {}) : null

          return (
            <div key={pt.key} className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base">{pt.label}</h3>
                {!pt.dynamic && <span className="text-xs text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">+{pt.points} баллов</span>}
                {pt.dynamic && <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">Ставка × коэф</span>}
              </div>

              {done ? (
                <div className="bg-green-900/20 border border-green-700/50 rounded-xl px-3 py-2 text-sm text-green-400">
                  ✓ Твой прогноз: <span className="font-bold">{myPred?.pred_value}</span>
                  {myPred?.is_settled && (
                    <span className={`ml-2 ${myPred.is_correct ? 'text-green-300' : 'text-red-400'}`}>
                      {myPred.is_correct ? `+${myPred.points_earned} ✓` : '0 ✗'}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  {/* Options grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelected(s => ({ ...s, [pt.key]: opt }))}
                        disabled={!isPredOpen}
                        className={`py-2 px-3 rounded-xl border text-sm font-display font-semibold transition-all ${
                          selected[pt.key] === opt
                            ? 'bg-[#f59e0b] border-[#f59e0b] text-black'
                            : 'bg-[#0a0d14] border-[#1f2937] text-gray-300'
                        } disabled:opacity-40`}
                      >
                        {opt}
                        {coefs && <span className="block text-xs opacity-70">×{coefs[opt]}</span>}
                      </button>
                    ))}
                  </div>

                  {/* Series wager */}
                  {pt.dynamic && selected[pt.key] && isPredOpen && (
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Ставка (у тебя {user?.points} баллов)</label>
                      <input
                        type="number"
                        min={1}
                        max={user?.points || 0}
                        value={wagers[pt.key] || ''}
                        onChange={e => setWagers(w => ({ ...w, [pt.key]: e.target.value }))}
                        placeholder="Кол-во баллов..."
                        className="w-full bg-[#0a0d14] border border-[#1f2937] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
                      />
                      {selected[pt.key] && wagers[pt.key] && (
                        <p className="text-xs text-purple-400 mt-1">
                          Выигрыш: {Math.floor(parseInt(wagers[pt.key]) * (coefs?.[selected[pt.key]] || 1))} баллов
                        </p>
                      )}
                    </div>
                  )}

                  {errors[pt.key] && (
                    <p className="text-xs text-red-400">{errors[pt.key]}</p>
                  )}

                  {success[pt.key] && (
                    <p className="text-xs text-green-400">✓ Прогноз сохранён!</p>
                  )}

                  {isPredOpen && selected[pt.key] && !done && (
                    <button
                      onClick={() => submitPrediction(pt.key)}
                      disabled={submitting[pt.key] || (pt.dynamic && !wagers[pt.key])}
                      className="w-full bg-[#f59e0b] text-black font-display font-bold py-2 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50"
                    >
                      {submitting[pt.key] ? '...' : 'Подтвердить прогноз'}
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

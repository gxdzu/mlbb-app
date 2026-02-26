import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { matchesApi, predictionsApi } from '../api/client'
import useStore from '../store/useStore'

const SERIES_COEFS = {
  bo3: { '2-0': 1.5, '0-2': 1.5, '2-1': 2.0, '1-2': 2.0 },
  bo5: { '3-0': 2.5, '0-3': 2.5, '3-1': 2.0, '1-3': 2.0, '3-2': 1.5, '2-3': 1.5 },
  bo7: { '4-0': 3.0, '0-4': 3.0, '4-1': 2.5, '1-4': 2.5, '4-2': 2.0, '2-4': 2.0, '4-3': 1.5, '3-4': 1.5 },
}
const SERIES_MAP_COUNT = { bo1: 1, bo3: 2, bo5: 3, bo7: 4 }

function parseAsIs(dt) {
  if (!dt) return null
  // Strip timezone suffix — treat stored time as MSK display time
  const s = dt.replace('Z', '').replace(/\+\d{2}:\d{2}$/, '')
  return new Date(s)
}

function buildPredTypes(match) {
  if (!match) return []
  const mapCount = SERIES_MAP_COUNT[match.series_type] || 1
  const players = [...(match.team1_players || []), ...(match.team2_players || [])]
  const types = []
  if (match.kills_options?.length)
    types.push({ key: 'kills_total', label: '🔫 Тотал киллов (серия)', points: 5, options: match.kills_options })
  if (match.duration_options?.length)
    types.push({ key: 'map_duration', label: '⏱ Длительность карты', points: 5, options: match.duration_options })
  if (players.length) {
    for (let i = 1; i <= mapCount; i++) {
      types.push({ key: `first_blood_${i}`, label: `🩸 Первая кровь — Карта ${i}`, points: 10, options: players, mapNum: i })
      types.push({ key: `mvp_${i}`, label: `⭐ MVP — Карта ${i}`, points: 5, options: players, mapNum: i })
    }
  }
  types.push({ key: 'winner', label: '🏆 Победитель', points: 1, options: [match.team1_name, match.team2_name] })
  const scoreOptions = Object.keys(SERIES_COEFS[match.series_type] || {})
  if (scoreOptions.length)
    types.push({ key: 'series_score', label: '📊 Счёт серии', dynamic: true, options: scoreOptions })
  return types
}

// Results section for finished match
function MatchResults({ match }) {
  const mapCount = SERIES_MAP_COUNT[match.series_type] || 1
  const fbResults = match.result_first_blood || []
  const mvpResults = match.result_mvp || []

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
      <div className="px-4 py-2 bg-green-900/20 border-b border-[#1f2937]">
        <span className="font-display font-bold text-green-400 text-sm tracking-wider">РЕЗУЛЬТАТЫ МАТЧА</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Overall */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Победитель</span>
          <span className="font-display font-bold text-white">{match.result_winner || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Счёт серии</span>
          <span className="font-display font-bold text-[#f59e0b]">{match.result_score || '—'}</span>
        </div>
        {match.result_kills_total && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Тотал киллов</span>
            <span className="font-display font-bold text-white">{match.result_kills_total}</span>
          </div>
        )}
        {match.result_duration && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Длительность карты</span>
            <span className="font-display font-bold text-white">{match.result_duration}</span>
          </div>
        )}

        {/* Per-map */}
        {(fbResults.length > 0 || mvpResults.length > 0) && (
          <div className="border-t border-[#1f2937] pt-3 space-y-2">
            <p className="text-xs text-gray-600 uppercase tracking-widest">По картам</p>
            {Array.from({ length: mapCount }, (_, i) => i).map(i => {
              const fb = fbResults[i]
              const mvp = mvpResults[i]
              if (!fb && !mvp) return null
              return (
                <div key={i} className="bg-[#0d1117] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-[#f59e0b] font-display font-bold">Карта {i + 1}</p>
                  {fb && <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Первая кровь</span>
                    <span className="text-white font-display">{fb}</span>
                  </div>}
                  {mvp && <div className="flex justify-between text-sm">
                    <span className="text-gray-500">MVP</span>
                    <span className="text-white font-display">{mvp}</span>
                  </div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PredCard({ pt, isPredOpen, done, myPred, selected, wager, coefs, user, error, successState, onSelect, onWager, onSubmit, submitting }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm">{pt.label}</h3>
        {!pt.dynamic
          ? <span className="text-xs text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">+{pt.points} баллов</span>
          : <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">Ставка × коэф</span>}
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
          <div className="grid grid-cols-2 gap-2">
            {pt.options.map(opt => (
              <button key={opt} onClick={() => onSelect(opt)} disabled={!isPredOpen}
                className={`py-2 px-3 rounded-xl border text-sm font-display font-semibold transition-all ${
                  selected === opt ? 'bg-[#f59e0b] border-[#f59e0b] text-black' : 'bg-[#0a0d14] border-[#1f2937] text-gray-300'
                } disabled:opacity-40`}>
                {opt}
                {coefs && pt.dynamic && <span className="block text-xs opacity-70">×{coefs[opt]}</span>}
              </button>
            ))}
          </div>
          {pt.dynamic && selected && isPredOpen && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ставка (у тебя {user?.points} баллов)</label>
              <input type="number" min={1} max={user?.points || 0} value={wager || ''} onChange={e => onWager(e.target.value)}
                placeholder="Кол-во баллов..."
                className="w-full bg-[#0a0d14] border border-[#1f2937] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b]" />
              {selected && wager && (
                <p className="text-xs text-purple-400 mt-1">Выигрыш: {Math.floor(parseInt(wager) * (coefs?.[selected] || 1))} баллов</p>
              )}
            </div>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          {successState && <p className="text-xs text-green-400">✓ Прогноз сохранён!</p>}
          {isPredOpen && selected && !done && (
            <button onClick={onSubmit} disabled={submitting || (pt.dynamic && !wager)}
              className="w-full bg-[#f59e0b] text-black font-display font-bold py-2 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50">
              {submitting ? '...' : 'Подтвердить прогноз'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default function MatchDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useStore()
  const [match, setMatch] = useState(null)
  const [myPreds, setMyPreds] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState({})
  const [wagers, setWagers] = useState({})
  const [submitting, setSubmitting] = useState({})
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState({})

  useEffect(() => {
    Promise.all([matchesApi.getOne(id), matchesApi.getMyPredictions(id)])
      .then(([m, p]) => { setMatch(m.data); setMyPreds(p.data) })
      .finally(() => setLoading(false))
  }, [id])

  const alreadyPredicted = (type) => myPreds.some(p => p.pred_type === type)

  const submitPrediction = async (type) => {
    const value = selected[type]
    if (!value) return
    setSubmitting(s => ({ ...s, [type]: true }))
    setErrors(e => ({ ...e, [type]: null }))
    try {
      await predictionsApi.create({
        match_id: parseInt(id), pred_type: type, pred_value: value,
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
  const predTypes = buildPredTypes(match)
  const coefs = SERIES_COEFS[match.series_type] || {}
  const mapCount = SERIES_MAP_COUNT[match.series_type] || 1

  const cardProps = (pt) => ({
    pt, isPredOpen,
    done: alreadyPredicted(pt.key),
    myPred: myPreds.find(p => p.pred_type === pt.key),
    selected: selected[pt.key], wager: wagers[pt.key],
    coefs, user, error: errors[pt.key], successState: success[pt.key],
    onSelect: val => setSelected(s => ({ ...s, [pt.key]: val })),
    onWager: val => setWagers(w => ({ ...w, [pt.key]: val })),
    onSubmit: () => submitPrediction(pt.key),
    submitting: submitting[pt.key],
  })

  return (
    <div className="p-4 space-y-4 pb-24">
      <button onClick={() => navigate(-1)} className="text-gray-400 text-sm flex items-center gap-1">← Назад</button>

      {/* Match header */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
        <div className="flex items-center justify-center gap-4">
          <div className="text-center flex-1"><div className="font-display text-xl font-bold">{match.team1_name}</div></div>
          <div className="text-center px-2">
            <div className="font-display text-[#f59e0b] font-bold">{match.series_type.toUpperCase()}</div>
            {match.status === 'finished' && match.result_score && <div className="font-display text-2xl font-bold mt-1">{match.result_score}</div>}
            {match.status === 'live' && <div className="text-red-400 text-sm font-bold animate-pulse">● LIVE</div>}
          </div>
          <div className="text-center flex-1"><div className="font-display text-xl font-bold">{match.team2_name}</div></div>
        </div>
        {match.scheduled_at && (
          <div className="text-center text-xs text-gray-500 mt-3">
            {parseAsIs(match.scheduled_at)?.toLocaleString('ru', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })} МСК
          </div>
        )}
      </div>

      {/* Status banners */}
      {!isPredOpen && match.status === 'upcoming' && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl px-4 py-2 text-yellow-400 text-sm text-center">⏰ Приём прогнозов закрыт</div>
      )}
      {match.status === 'finished' && (
        <div className="bg-green-900/20 border border-green-700 rounded-xl px-4 py-2 text-green-400 text-sm text-center">✅ Матч завершён — прогнозы посчитаны</div>
      )}

      {/* Results block — shown when finished */}
      {match.status === 'finished' && match.result_winner && (
        <MatchResults match={match} />
      )}

      {/* Predictions */}
      <div className="space-y-3">
        {predTypes.filter(pt => !pt.mapNum).map(pt => (
          <div key={pt.key} className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
            <PredCard {...cardProps(pt)} />
          </div>
        ))}
      </div>

      {predTypes.some(pt => pt.mapNum) && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#1f2937]" />
            <span className="text-xs text-gray-500 tracking-widest uppercase">Прогнозы по картам</span>
            <div className="h-px flex-1 bg-[#1f2937]" />
          </div>
          {Array.from({ length: mapCount }, (_, i) => i + 1).map(mapNum => (
            <div key={mapNum} className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden">
              <div className="px-4 py-2 bg-[#f59e0b]/10 border-b border-[#1f2937]">
                <span className="font-display font-bold text-[#f59e0b] text-sm tracking-wider">КАРТА {mapNum}</span>
              </div>
              <div className="p-4 space-y-4">
                {predTypes.filter(pt => pt.mapNum === mapNum).map(pt => (
                  <PredCard key={pt.key} {...cardProps(pt)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

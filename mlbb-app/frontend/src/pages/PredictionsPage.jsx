import React, { useEffect, useState } from 'react'
import { predictionsApi } from '../api/client'

// Labels for all prediction types including per-map
const TYPE_LABELS = {
  kills_total:    'Тотал киллов',
  map_duration:   'Длительность карты',
  winner:         'Победитель',
  series_score:   'Счёт серии',
  first_blood_1:  'Первая кровь — Карта 1',
  first_blood_2:  'Первая кровь — Карта 2',
  first_blood_3:  'Первая кровь — Карта 3',
  first_blood_4:  'Первая кровь — Карта 4',
  first_blood_5:  'Первая кровь — Карта 5',
  mvp_1:          'MVP — Карта 1',
  mvp_2:          'MVP — Карта 2',
  mvp_3:          'MVP — Карта 3',
  mvp_4:          'MVP — Карта 4',
  mvp_5:          'MVP — Карта 5',
}

const TYPE_POINTS = {
  kills_total: '+5', map_duration: '+5', winner: '+1',
  series_score: '× коэфф.',
  first_blood_1: '+10', first_blood_2: '+10', first_blood_3: '+10',
  first_blood_4: '+10', first_blood_5: '+10',
  mvp_1: '+5', mvp_2: '+5', mvp_3: '+5', mvp_4: '+5', mvp_5: '+5',
}

export default function PredictionsPage() {
  const [preds, setPreds] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      predictionsApi.getMy(),
      predictionsApi.getMyStats(),
    ]).then(([p, s]) => {
      setPreds(p.data)
      setStats(s.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="font-display text-2xl font-bold pt-2">Мои прогнозы</h1>

      {/* Stats */}
      {stats && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-display text-2xl font-bold text-[#f59e0b]">{stats.points}</div>
              <div className="text-xs text-gray-500">Баллов</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white">{stats.total_predictions}</div>
              <div className="text-xs text-gray-500">Прогнозов</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-green-400">{stats.accuracy}%</div>
              <div className="text-xs text-gray-500">Точность</div>
            </div>
          </div>

          <div className="border-t border-[#1f2937] pt-3 space-y-1.5">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Баллы по категориям</p>
            {[
              ['Тотал киллов', stats.points_from_kills],
              ['Длительность', stats.points_from_duration],
              ['Первая кровь', stats.points_from_first_blood],
              ['MVP', stats.points_from_mvp],
              ['Победитель', stats.points_from_winner],
              ['Счёт серии', stats.points_from_series],
            ].map(([label, val]) => val > 0 && (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-display font-bold text-[#f59e0b]">+{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <p className="text-xs text-gray-600 uppercase tracking-widest">История прогнозов</p>

      {preds.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">🎯</div>
          <p>Ты ещё не делал прогнозов</p>
        </div>
      ) : (
        <div className="space-y-2">
          {preds.map(p => (
            <div key={p.id}
              className="bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-display font-semibold text-white truncate">
                  {TYPE_LABELS[p.pred_type] || p.pred_type}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Прогноз: <span className="text-gray-300">{p.pred_value}</span>
                </div>
                {p.pred_type === 'series_score' && p.points_wagered > 0 && (
                  <div className="text-xs text-purple-400 mt-0.5">
                    Ставка: {p.points_wagered} × {p.coefficient}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {!p.is_settled ? (
                  <span className="text-xs text-gray-600 bg-[#0d1117] border border-[#1f2937] px-2 py-0.5 rounded-full">
                    Ожидание
                  </span>
                ) : p.is_correct ? (
                  <div>
                    <div className="text-sm font-display font-bold text-green-400">+{p.points_earned}</div>
                    <div className="text-xs text-green-600">верно</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-display font-bold text-red-500">0</div>
                    <div className="text-xs text-red-700">неверно</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { predictionsApi } from '../api/client'
import useStore from '../store/useStore'

const TYPE_LABELS = {
  kills_total: '🔫 Тотал киллов',
  map_duration: '⏱ Длительность',
  first_blood: '🩸 Первая кровь',
  mvp: '⭐ MVP',
  winner: '🏆 Победитель',
  series_score: '📊 Счёт серии',
}

export default function PredictionsPage() {
  const { user } = useStore()
  const [preds, setPreds] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('history')

  useEffect(() => {
    Promise.all([
      predictionsApi.getMy(),
      predictionsApi.getMyStats()
    ]).then(([p, s]) => {
      setPreds(p.data)
      setStats(s.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-display text-2xl font-bold pt-2">Мои прогнозы</h1>

      {/* Stats card */}
      {stats && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-display text-2xl font-bold text-[#f59e0b]">{stats.points}</div>
              <div className="text-xs text-gray-400">Баллов</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white">{stats.total_predictions}</div>
              <div className="text-xs text-gray-400">Прогнозов</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-green-400">{stats.accuracy}%</div>
              <div className="text-xs text-gray-400">Точность</div>
            </div>
          </div>

          {/* Points breakdown */}
          <div className="mt-4 space-y-1.5">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Баллы по категориям</p>
            {[
              ['🔫 Тотал киллов', stats.points_from_kills],
              ['⏱ Длительность', stats.points_from_duration],
              ['🩸 Первая кровь', stats.points_from_first_blood],
              ['⭐ MVP', stats.points_from_mvp],
              ['🏆 Победитель', stats.points_from_winner],
              ['📊 Счёт серии', stats.points_from_series],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{label}</span>
                <span className="font-display font-bold text-[#f59e0b]">+{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">История прогнозов</p>
        {preds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-gray-400">Ты ещё не делал прогнозов</p>
          </div>
        ) : (
          <div className="space-y-2">
            {preds.map(p => (
              <div key={p.id} className="bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-display font-semibold">{TYPE_LABELS[p.pred_type]}</div>
                  <div className="text-xs text-gray-400">Прогноз: <span className="text-white">{p.pred_value}</span></div>
                  {p.pred_type === 'series_score' && p.points_wagered > 0 && (
                    <div className="text-xs text-purple-400">Ставка: {p.points_wagered} × {p.coefficient}</div>
                  )}
                </div>
                <div className="text-right">
                  {!p.is_settled ? (
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Ожидание</span>
                  ) : p.is_correct ? (
                    <span className="text-sm font-display font-bold text-green-400">+{p.points_earned} ✓</span>
                  ) : (
                    <span className="text-sm font-display font-bold text-red-400">0 ✗</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

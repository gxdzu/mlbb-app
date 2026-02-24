import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { matchesApi } from '../api/client'

const TABS = [
  { key: null, label: 'Все' },
  { key: 'upcoming', label: '📅 Предстоящие' },
  { key: 'live', label: '🔴 LIVE' },
  { key: 'finished', label: '✓ Завершённые' },
]

function formatDate(dt) {
  return new Date(dt).toLocaleString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MatchesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async (status) => {
    setLoading(true)
    try {
      const params = status ? { status } : {}
      const { data } = await matchesApi.getAll(params)
      setMatches(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(activeTab) }, [activeTab])

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-display text-2xl font-bold pt-2">Матчи</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button
            key={String(t.key)}
            onClick={() => setActiveTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-display font-semibold border transition-all ${
              activeTab === t.key
                ? 'bg-[#f59e0b] border-[#f59e0b] text-black'
                : 'bg-[#111827] border-[#1f2937] text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" /></div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">⚔️</div>
          <p className="text-gray-400">Матчи не найдены</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <div
              key={m.id}
              onClick={() => navigate(`/matches/${m.id}`)}
              className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs text-gray-500">{m.series_type.toUpperCase()}</div>
                {m.status === 'live' && <span className="text-xs text-red-400 font-bold animate-pulse">● LIVE</span>}
                {m.status === 'upcoming' && <span className="text-xs text-blue-400">{formatDate(m.scheduled_at)}</span>}
                {m.status === 'finished' && <span className="text-xs text-gray-500">Завершён</span>}
              </div>
              <div className="flex items-center justify-between">
                <div className="font-display font-bold text-lg text-white flex-1">{m.team1_name}</div>
                <div className="px-4 text-center">
                  {m.status === 'finished' && m.result_score ? (
                    <span className="font-display font-bold text-[#f59e0b] text-xl">{m.result_score}</span>
                  ) : (
                    <span className="font-display text-gray-600 text-lg">vs</span>
                  )}
                </div>
                <div className="font-display font-bold text-lg text-white flex-1 text-right">{m.team2_name}</div>
              </div>
              {m.status === 'upcoming' && (
                <div className="mt-3 text-center">
                  <span className="text-xs bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-3 py-1 rounded-full">
                    Сделать прогноз →
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

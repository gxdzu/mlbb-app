import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tournamentsApi, matchesApi } from '../api/client'
import useStore from '../store/useStore'

const STATUS_BADGE = {
  upcoming: { label: 'Скоро', color: 'bg-blue-900/50 text-blue-400 border-blue-700' },
  live: { label: '● LIVE', color: 'bg-red-900/50 text-red-400 border-red-700 animate-pulse' },
  finished: { label: 'Завершён', color: 'bg-gray-800 text-gray-400 border-gray-700' },
}

function parseUTC(dt) {
  if (!dt) return null
  // Add Z only if no timezone info present
  const s = dt.endsWith('Z') || dt.includes('+') ? dt : dt + 'Z'
  return new Date(s)
}

function formatDate(dt) {
  const d = parseUTC(dt)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })
}

export default function HomePage() {
  const { user } = useStore()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [selected, setSelected] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tournamentsApi.getAll().then(r => {
      setTournaments(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selected) {
      matchesApi.getAll({ tournament_id: selected.id }).then(r => setMatches(r.data))
    }
  }, [selected])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Привет, {user?.first_name}! 👋</h1>
          <p className="text-sm text-gray-400">Сделай прогноз и зарабатывай баллы</p>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-bold text-[#f59e0b]">{user?.points}</div>
          <div className="text-xs text-gray-500">баллов</div>
        </div>
      </div>

      {/* Tournament selector */}
      {tournaments.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-display">Турниры</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {tournaments.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-display font-semibold tracking-wide transition-all ${
                  selected?.id === t.id
                    ? 'bg-[#f59e0b] border-[#f59e0b] text-black'
                    : 'bg-[#111827] border-[#1f2937] text-gray-300'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected tournament info */}
      {selected && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            {selected.logo_url && (
              <img src={selected.logo_url} alt="" className="w-10 h-10 rounded-xl object-contain bg-[#0d1117] p-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold truncate">{selected.name}</h2>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-display ${STATUS_BADGE[selected.status]?.color}`}>
                  {STATUS_BADGE[selected.status]?.label}
                </span>
              </div>
              {selected.prize_pool && (
                <p className="text-sm text-[#f59e0b] mt-0.5">Prize: {selected.prize_pool}</p>
              )}
            </div>
          </div>
          {selected.description && (
            <p className="text-sm text-gray-400">{selected.description}</p>
          )}
          {(selected.start_date || selected.end_date) && (
            <p className="text-xs text-gray-500 mt-2">
              {selected.start_date && formatDate(selected.start_date)}
              {selected.end_date && ` — ${formatDate(selected.end_date)}`}
            </p>
          )}
        </div>
      )}

      {/* Matches list */}
      {selected && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-display">Матчи турнира</p>
          {matches.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Матчи ещё не добавлены</p>
          ) : (
            <div className="space-y-3">
              {matches.map(m => <MatchCard key={m.id} match={m} onClick={() => navigate(`/matches/${m.id}`)} />)}
            </div>
          )}
        </div>
      )}

      {tournaments.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-gray-400">Турниры скоро появятся</p>
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, onClick }) {
  const statusStyle = {
    upcoming: 'border-l-blue-500',
    live: 'border-l-red-500',
    finished: 'border-l-gray-600',
  }
  const statusLabel = {
    upcoming: <span className="text-xs text-blue-400">📅 {formatDate(match.scheduled_at)}</span>,
    live: <span className="text-xs text-red-400 font-bold animate-pulse">● LIVE</span>,
    finished: <span className="text-xs text-gray-500">✓ {match.result_score || 'Завершён'}</span>,
  }

  return (
    <div
      onClick={onClick}
      className={`bg-[#111827] border border-[#1f2937] border-l-4 ${statusStyle[match.status]} rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-display font-bold text-lg text-white">{match.team1_name}</div>
          <div className="text-xs text-gray-500 my-1 font-display">VS</div>
          <div className="font-display font-bold text-lg text-white">{match.team2_name}</div>
        </div>
        <div className="text-right space-y-1">
          {statusLabel[match.status]}
          <div className="text-xs text-gray-500 block">{match.series_type.toUpperCase()}</div>
          {match.status === 'upcoming' && (
            <div className="text-xs bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-2 py-0.5 rounded-full">
              Сделать ставку →
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tournamentsApi, matchesApi } from '../api/client'
import useStore from '../store/useStore'

const STATUS_BADGE = {
  upcoming: { label: 'Скоро', color: 'bg-blue-900/50 text-blue-400 border-blue-700' },
  live: { label: '● LIVE', color: 'bg-red-900/50 text-red-400 border-red-700 animate-pulse' },
  finished: { label: 'Завершён', color: 'bg-gray-800 text-gray-400 border-gray-700' },
}

function formatDate(dt) {
  if (!dt) return '—'
  // Strip Z/timezone and parse as local — we store and display in MSK as-is
  const s = dt.replace('Z', '').replace(/\+\d{2}:\d{2}$/, '')
  const d = new Date(s)
  if (isNaN(d)) return '—'
  return d.toLocaleString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function sortMatchesHome(matches) {
  const order = { upcoming: 0, live: 1, finished: 2, cancelled: 3 }
  return [...matches].sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    // Within same status: upcoming — newest first (closest time first)
    const da = new Date(a.scheduled_at.replace('Z','').replace(/\+.*$/,''))
    const db = new Date(b.scheduled_at.replace('Z','').replace(/\+.*$/,''))
    return da - db
  })
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
      matchesApi.getAll({ tournament_id: selected.id }).then(r => setMatches(sortMatchesHome(r.data)))
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

      {/* News channel banner — subtle, dismissible */}
      <a href="https://t.me/CKO_analytics" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-2.5 no-underline active:scale-[0.98] transition-transform">
        <div className="w-7 h-7 rounded-lg bg-[#0088cc]/20 border border-[#0088cc]/30 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#0088cc]">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.547c-.144.647-.537.806-1.088.502l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.697l-2.95-.924c-.642-.2-.655-.642.135-.951l11.526-4.446c.535-.194 1.003.13.37.872z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-display font-bold text-white">НАШ ТГК</div>
          <div className="text-xs text-gray-500 truncate">Новости и инсайды</div>
        </div>
        <div className="text-xs text-[#0088cc] flex-shrink-0">→</div>
      </a>

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

function VoteBar({ votes, total, team1, team2 }) {
  if (!total || total === 0) return null
  const p1 = votes[team1] || 0
  const p2 = votes[team2] || 0
  return (
    <div className="mt-3 space-y-1">
      <div className="flex h-1 rounded-full overflow-hidden bg-[#1f2937]">
        <div className="bg-blue-500 transition-all duration-500" style={{ width: `${p1}%` }} />
        <div className="bg-red-500 transition-all duration-500" style={{ width: `${p2}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span className="text-blue-400">{p1}%</span>
        <span>{total} голосов</span>
        <span className="text-red-400">{p2}%</span>
      </div>
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

  const isTBD = match.team1_name?.toUpperCase() === 'TBD' || match.team2_name?.toUpperCase() === 'TBD'
  const [votes, setVotes] = React.useState(null)

  React.useEffect(() => {
    if (match.status === 'upcoming' || match.status === 'live') {
      matchesApi.getVotes(match.id).then(r => setVotes(r.data)).catch(() => {})
    }
  }, [match.id])

  return (
    <div
      onClick={!isTBD ? onClick : undefined}
      className={`bg-[#111827] border border-[#1f2937] border-l-4 ${statusStyle[match.status]} rounded-2xl p-4 transition-transform ${!isTBD ? 'cursor-pointer active:scale-[0.98]' : 'opacity-60 cursor-default'}`}
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
            isTBD ? (
              <div className="text-xs bg-gray-800 border border-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
                Соперник TBD
              </div>
            ) : (
              <div className="text-xs bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-2 py-0.5 rounded-full">
                Сделать ставку →
              </div>
            )
          )}
        </div>
      </div>
      {votes && votes.total > 0 && (
        <VoteBar votes={votes.votes} total={votes.total} team1={match.team1_name} team2={match.team2_name} />
      )}
    </div>
  )
}

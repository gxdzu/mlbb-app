import React, { useEffect, useState } from 'react'
import { usersApi } from '../api/client'
import useStore from '../store/useStore'

export default function LeaderboardPage() {
  const { user } = useStore()
  const [leaders, setLeaders] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([usersApi.getLeaderboard(), usersApi.getMyRank()]).then(([l, r]) => {
      setLeaders(l.data)
      setMyRank(r.data)
    }).finally(() => setLoading(false))
  }, [])

  const MEDALS = ['🥇', '🥈', '🥉']

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-display text-2xl font-bold pt-2">🏆 Рейтинг</h1>

      {myRank && (
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Твоя позиция</p>
              <p className="font-display text-3xl font-bold text-[#f59e0b]">#{myRank.rank}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Баллов</p>
              <p className="font-display text-2xl font-bold text-white">{myRank.user.points}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {leaders.map(({ rank, user: u }) => (
          <div
            key={u.id}
            className={`bg-[#111827] border rounded-xl px-4 py-3 flex items-center gap-3 ${
              u.tg_id === user?.tg_id ? 'border-[#f59e0b]/50' : 'border-[#1f2937]'
            }`}
          >
            <div className="w-8 text-center font-display font-bold text-lg">
              {rank <= 3 ? MEDALS[rank - 1] : <span className="text-gray-500">#{rank}</span>}
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-white">{u.first_name}</div>
              <div className="text-xs text-gray-500">{u.game_nickname} · {u.accuracy}% точность</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-[#f59e0b]">{u.points}</div>
              <div className="text-xs text-gray-500">{u.total_predictions} прогн.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

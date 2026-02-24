import React from 'react'
import useStore from '../store/useStore'

export default function ProfilePage() {
  const { user } = useStore()

  if (!user) return null

  const statItems = [
    { label: 'Всего прогнозов', value: user.total_predictions },
    { label: 'Верных', value: user.correct_predictions },
    { label: 'Точность', value: `${user.accuracy}%` },
    { label: 'Игровой никнейм', value: user.game_nickname },
    { label: 'ID в игре', value: user.game_id },
  ]

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-display text-2xl font-bold pt-2">Профиль</h1>

      {/* Avatar & name */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#f59e0b]/20 border-2 border-[#f59e0b] flex items-center justify-center text-4xl mx-auto mb-3">
          🎮
        </div>
        <h2 className="font-display text-2xl font-bold">{user.first_name}</h2>
        {user.tg_username && <p className="text-gray-400 text-sm">@{user.tg_username}</p>}
        <div className="mt-4 inline-block bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-full px-6 py-2">
          <span className="font-display text-2xl font-bold text-[#f59e0b]">{user.points}</span>
          <span className="text-sm text-gray-400 ml-1">баллов</span>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl divide-y divide-[#1f2937]">
        {statItems.map(item => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-400">{item.label}</span>
            <span className="font-display font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>

      {/* How points work */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 space-y-2">
        <p className="font-display font-bold text-sm uppercase tracking-widest text-gray-400">Система баллов</p>
        {[
          ['🔫 Тотал киллов', '+5'],
          ['⏱ Длительность карты', '+5'],
          ['🩸 Первая кровь', '+10'],
          ['⭐ MVP карты', '+5'],
          ['🏆 Победитель', '+1'],
          ['📊 Счёт серии', '× коэфф.'],
        ].map(([label, pts]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-300">{label}</span>
            <span className="font-display font-bold text-[#f59e0b]">{pts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

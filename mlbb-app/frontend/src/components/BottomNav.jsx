import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/', icon: '🏠', label: 'Главная' },
  { path: '/matches', icon: '⚔️', label: 'Матчи' },
  { path: '/predictions', icon: '🎯', label: 'Прогнозы' },
  { path: '/leaderboard', icon: '🏆', label: 'Рейтинг' },
  { path: '/profile', icon: '👤', label: 'Профиль' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#111827] border-t border-[#1f2937] z-50">
      <div className="flex">
        {tabs.map(tab => {
          const active = pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path))
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-all ${
                active ? 'text-[#f59e0b]' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-[10px] font-display tracking-wide ${active ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {active && <div className="absolute bottom-0 w-8 h-0.5 bg-[#f59e0b] rounded-t-full" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

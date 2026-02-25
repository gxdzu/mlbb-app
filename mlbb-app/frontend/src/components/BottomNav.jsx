import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const HomeIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
    <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SwordsIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
    <path d="M14.5 17.5L3 6V3H6L17.5 14.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 19L19 13" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 16L20 20" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 6.5L6 3H3V6L6.5 9.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 20L8 15" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TargetIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
    <circle cx="12" cy="12" r="9" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="5" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
  </svg>
)

const TrophyIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
    <path d="M6 3H18V13C18 16.314 15.314 19 12 19C8.686 19 6 16.314 6 13V3Z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 7H3C3 10 4.5 11.5 6 12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 7H21C21 10 19.5 11.5 18 12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19V22" strokeLinecap="round"/>
    <path d="M8 22H16" strokeLinecap="round"/>
  </svg>
)

const UserIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
    <circle cx="12" cy="8" r="4" strokeLinecap="round"/>
    <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" strokeLinecap="round"/>
  </svg>
)

const tabs = [
  { path: '/', label: 'Главная', Icon: HomeIcon },
  { path: '/matches', label: 'Матчи', Icon: SwordsIcon },
  { path: '/predictions', label: 'Прогнозы', Icon: TargetIcon },
  { path: '/leaderboard', label: 'Рейтинг', Icon: TrophyIcon },
  { path: '/profile', label: 'Профиль', Icon: UserIcon },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0d1117] border-t border-[#1f2937] z-50">
      <div className="flex">
        {tabs.map(({ path, label, Icon }) => {
          const active = pathname === path || (path !== '/' && pathname.startsWith(path))
          return (
            <button key={path} onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative ${active ? 'text-[#f59e0b]' : 'text-gray-600'}`}>
              {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#f59e0b] rounded-b-full" />}
              <Icon active={active} />
              <span className={`text-[10px] font-display tracking-wide ${active ? 'font-bold text-[#f59e0b]' : 'text-gray-600'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

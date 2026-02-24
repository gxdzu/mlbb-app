import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store/useStore'
import { authApi, usersApi } from './api/client'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import MatchesPage from './pages/MatchesPage'
import MatchDetailPage from './pages/MatchDetailPage'
import PredictionsPage from './pages/PredictionsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  const { token, setToken, setUser, user } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#0a0d14')
      tg.setBackgroundColor('#0a0d14')
    }

    const init = async () => {
      if (token) {
        try {
          const { data } = await usersApi.getMe()
          setUser(data)
        } catch {
          // Token expired or invalid — try auto-login via initData
          await tryAutoLogin()
        }
      } else {
        await tryAutoLogin()
      }
      setLoading(false)
    }

    const tryAutoLogin = async () => {
      const initData = window.Telegram?.WebApp?.initData
      if (!initData) return
      try {
        const { data } = await authApi.login({ init_data: initData })
        setToken(data.access_token)
        setUser(data.user)
      } catch {
        // User not registered yet
      }
    }

    init()
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen max-w-md mx-auto relative">
        <div className="flex-1 overflow-y-auto scrollbar-none pb-16">
          <Routes>
            {!user ? (
              <>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/register" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/matches/:id" element={<MatchDetailPage />} />
                <Route path="/predictions" element={<PredictionsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </div>
        {user && <BottomNav />}
      </div>
    </BrowserRouter>
  )
}

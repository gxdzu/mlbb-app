import React, { useState } from 'react'
import useStore from '../store/useStore'
import { authApi } from '../api/client'

export default function RegisterPage() {
  const { setToken, setUser } = useStore()
  const [nickname, setNickname] = useState('')
  const [gameId, setGameId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!nickname.trim() || !gameId.trim()) {
      setError('Заполни все поля')
      return
    }
    setLoading(true)
    setError('')
    try {
      const initData = window.Telegram?.WebApp?.initData || ''
      const { data } = await authApi.register({
        init_data: initData,
        game_nickname: nickname.trim(),
        game_id: gameId.trim(),
      })
      setToken(data.access_token)
      setUser(data.user)
    } catch (e) {
      setError(e.response?.data?.detail || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0d14]">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">🎮</div>
        <h1 className="font-display text-4xl font-bold text-white tracking-wider">MLBB</h1>
        <p className="font-display text-lg text-[#f59e0b] tracking-widest uppercase">Predictions</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block font-display tracking-wide uppercase">
            Никнейм в игре
          </label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Введи никнейм..."
            className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block font-display tracking-wide uppercase">
            ID в игре
          </label>
          <input
            value={gameId}
            onChange={e => setGameId(e.target.value)}
            placeholder="Введи ID..."
            className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-[#f59e0b] text-black font-display font-bold text-lg py-3 rounded-xl tracking-wider uppercase hover:bg-[#d97706] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Зарегистрироваться'}
        </button>

        <p className="text-center text-xs text-gray-600">
          Начальный баланс: 0 баллов 💎
        </p>
      </div>
    </div>
  )
}

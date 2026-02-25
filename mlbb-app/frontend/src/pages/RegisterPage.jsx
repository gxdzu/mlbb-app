import React, { useState } from 'react'
import useStore from '../store/useStore'
import { authApi } from '../api/client'

export default function RegisterPage() {
  const { setToken, setUser } = useStore()
  const [nickname, setNickname] = useState('')
  const [gameId, setGameId] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!nickname.trim() || !gameId.trim()) { setError('Заполни все поля'); return }
    if (!termsAccepted) { setError('Необходимо принять пользовательское соглашение'); return }
    setLoading(true); setError('')
    try {
      const tg = window.Telegram?.WebApp
      const initData = tg?.initData || ''
      // Try to get photo URL from Telegram
      const tgUser = tg?.initDataUnsafe?.user
      const tgPhotoUrl = tgUser?.photo_url || null

      const { data } = await authApi.register({
        init_data: initData,
        game_nickname: nickname.trim(),
        game_id: gameId.trim(),
        terms_accepted: true,
        tg_photo_url: tgPhotoUrl,
      })
      setToken(data.access_token)
      setUser(data.user)
    } catch (e) {
      setError(e.response?.data?.detail || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (showTerms) return <TermsScreen onBack={() => setShowTerms(false)} onAccept={() => { setTermsAccepted(true); setShowTerms(false) }} />

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0d14]">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
            <rect width="64" height="64" rx="16" fill="#f59e0b" fillOpacity="0.15"/>
            <path d="M32 12L44 20V36L32 52L20 36V20L32 12Z" stroke="#f59e0b" strokeWidth="2" fill="none"/>
            <path d="M32 20L40 25V35L32 44L24 35V25L32 20Z" fill="#f59e0b" fillOpacity="0.3"/>
            <circle cx="32" cy="30" r="4" fill="#f59e0b"/>
          </svg>
        </div>
        <h1 className="font-display text-4xl font-bold text-white tracking-wider">MLBB</h1>
        <p className="font-display text-lg text-[#f59e0b] tracking-widest uppercase">Predictions</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-display tracking-widest uppercase">Никнейм в игре</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)}
            placeholder="Введи никнейм..."
            className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f59e0b] transition-colors" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-display tracking-widest uppercase">ID в игре</label>
          <input value={gameId} onChange={e => setGameId(e.target.value)}
            placeholder="Введи ID..."
            className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f59e0b] transition-colors" />
        </div>

        {/* Terms checkbox */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setTermsAccepted(v => !v)}
              className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                termsAccepted ? 'bg-[#f59e0b] border-[#f59e0b]' : 'border-gray-600 bg-transparent'
              }`}
            >
              {termsAccepted && (
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                  <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-300 leading-relaxed">
              Я принимаю{' '}
              <button onClick={e => { e.stopPropagation(); setShowTerms(true) }}
                className="text-[#f59e0b] underline underline-offset-2">
                Пользовательское соглашение
              </button>
              {' '}и{' '}
              <button onClick={e => { e.stopPropagation(); setShowTerms(true) }}
                className="text-[#f59e0b] underline underline-offset-2">
                Политику конфиденциальности
              </button>
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-2 text-red-400 text-sm">{error}</div>
        )}

        <button onClick={handleRegister} disabled={loading || !termsAccepted}
          className="w-full bg-[#f59e0b] text-black font-display font-bold text-lg py-3 rounded-xl tracking-wider uppercase hover:bg-[#d97706] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? '...' : 'Зарегистрироваться'}
        </button>
      </div>
    </div>
  )
}

function TermsScreen({ onBack, onAccept }) {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-[#1f2937]">
        <button onClick={onBack} className="text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="font-display font-bold text-white">Пользовательское соглашение</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-gray-300 leading-relaxed">
        <section>
          <h3 className="font-display font-bold text-white mb-2">1. О сервисе</h3>
          <p>MLBB Predictions — бесплатный развлекательный сервис прогнозов на матчи по Mobile Legends: Bang Bang. Никаких денежных взносов не требуется.</p>
        </section>
        <section>
          <h3 className="font-display font-bold text-white mb-2">2. Виртуальные баллы</h3>
          <p>Все баллы в сервисе виртуальные. Они не имеют денежного эквивалента и не могут быть обменяны на деньги, товары или услуги любого рода.</p>
        </section>
        <section>
          <h3 className="font-display font-bold text-[#f59e0b] mb-2">3. Не является азартной игрой</h3>
          <p>Сервис не является азартной игрой, лотереей или букмекерской деятельностью согласно Федеральному закону № 244-ФЗ «Об азартных играх» и № 138-ФЗ «О лотереях», так как не предполагает ни денежных взносов, ни денежных выигрышей.</p>
        </section>
        <section>
          <h3 className="font-display font-bold text-white mb-2">4. Правила участия</h3>
          <p>Запрещено создавать несколько аккаунтов, использовать сервис в мошеннических целях и нарушать его работу. Нарушение правил влечёт блокировку аккаунта.</p>
        </section>
        <section>
          <h3 className="font-display font-bold text-white mb-2">5. Персональные данные</h3>
          <p>Мы храним Telegram ID, имя, никнейм и Game ID в MLBB, а также игровую статистику. Данные не продаются третьим лицам. Полная Политика конфиденциальности доступна в профиле.</p>
        </section>
        <section>
          <h3 className="font-display font-bold text-white mb-2">6. Возраст</h3>
          <p>Сервис предназначен для лиц старше 14 лет.</p>
        </section>
      </div>
      <div className="p-4 border-t border-[#1f2937] space-y-2">
        <button onClick={onAccept}
          className="w-full bg-[#f59e0b] text-black font-display font-bold py-3 rounded-xl uppercase tracking-wider">
          Принимаю условия
        </button>
        <button onClick={onBack} className="w-full text-gray-500 text-sm py-2">Назад</button>
      </div>
    </div>
  )
}

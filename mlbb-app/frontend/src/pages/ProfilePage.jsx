import React, { useState } from 'react'
import useStore from '../store/useStore'

const DOCS = {
  privacy: {
    title: 'Политика конфиденциальности',
    content: [
      { heading: 'Что мы собираем', text: 'Telegram ID, имя, @username, фото профиля, никнейм и Game ID в MLBB (указываете сами), игровая статистика (баллы, прогнозы, точность).' },
      { heading: 'Зачем', text: 'Исключительно для работы сервиса: идентификация, начисление баллов, таблица лидеров, техническая поддержка.' },
      { heading: 'Передача третьим лицам', text: 'Данные не продаются и не передаются третьим лицам, кроме случаев предусмотренных законодательством РФ.' },
      { heading: 'Хранение', text: 'Данные хранятся на защищённых серверах (Supabase, Render) с передачей по HTTPS/TLS. Доступ ограничен администратором.' },
      { heading: 'Ваши права', text: 'Вы можете запросить удаление своих данных, обратившись к администратору. Запрос выполняется в течение 7 рабочих дней.' },
    ]
  },
  terms: {
    title: 'Пользовательское соглашение',
    content: [
      { heading: 'О сервисе', text: 'MLBB Predictions — бесплатный развлекательный сервис прогнозов на матчи по Mobile Legends: Bang Bang. Никаких денежных взносов не требуется.' },
      { heading: 'Виртуальные баллы', text: 'Все баллы виртуальные. Не имеют денежного эквивалента и не могут быть обменяны на деньги, товары или услуги.' },
      { heading: 'Не азартная игра', text: 'Сервис не является азартной игрой, лотереей или букмекерской деятельностью согласно ФЗ-244 и ФЗ-138 — не предполагает денежных взносов и денежных выигрышей.' },
      { heading: 'Правила', text: 'Запрещено создавать несколько аккаунтов, мошенничать, нарушать работу сервиса. Нарушение правил влечёт блокировку.' },
      { heading: 'Возраст', text: 'Сервис предназначен для лиц старше 14 лет.' },
    ]
  }
}

const pointsSystem = [
  ['Тотал киллов', '+5'],
  ['Длительность карты', '+5'],
  ['Первая кровь / карта', '+10'],
  ['MVP / карта', '+5'],
  ['Победитель матча', '+1'],
  ['Счёт серии', '× коэфф.'],
]

export default function ProfilePage() {
  const { user } = useStore()
  const [openDoc, setOpenDoc] = useState(null)

  if (!user) return null
  if (openDoc) return <DocScreen doc={DOCS[openDoc]} onBack={() => setOpenDoc(null)} />

  const statItems = [
    { label: 'Всего прогнозов', value: user.total_predictions },
    { label: 'Верных', value: user.correct_predictions },
    { label: 'Точность', value: `${user.accuracy ?? 0}%` },
    { label: 'Никнейм в игре', value: user.game_nickname },
    { label: 'ID в игре', value: user.game_id },
  ]

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="font-display text-2xl font-bold pt-2">Профиль</h1>

      {/* Avatar & name */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 text-center">
        <div className="w-20 h-20 rounded-full border-2 border-[#f59e0b] mx-auto mb-3 overflow-hidden flex items-center justify-center bg-[#f59e0b]/10">
          {user.tg_photo_url ? (
            <img src={user.tg_photo_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 text-[#f59e0b]">
              <circle cx="20" cy="15" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 35c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <h2 className="font-display text-2xl font-bold">{user.first_name}</h2>
        {user.tg_username && <p className="text-gray-400 text-sm mt-0.5">@{user.tg_username}</p>}
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

      {/* Points system */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 space-y-2">
        <p className="font-display font-bold text-xs uppercase tracking-widest text-gray-500 mb-3">Система баллов</p>
        {pointsSystem.map(([label, pts]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-300">{label}</span>
            <span className="font-display font-bold text-[#f59e0b]">{pts}</span>
          </div>
        ))}
      </div>

      {/* Support */}
      <a href="https://t.me/gxdzu_official" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 bg-[#111827] border border-[#1f2937] rounded-2xl px-4 py-3 no-underline active:scale-[0.98] transition-transform">
        <div className="w-8 h-8 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/30 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#0088cc]">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.547c-.144.647-.537.806-1.088.502l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.697l-2.95-.924c-.642-.2-.655-.642.135-.951l11.526-4.446c.535-.194 1.003.13.37.872z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-display font-bold text-white">Поддержка</div>
          <div className="text-xs text-gray-500">@gxdzu_official</div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-600">
          <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>

      {/* Documents */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl divide-y divide-[#1f2937]">
        <p className="px-4 pt-3 pb-2 font-display font-bold text-xs uppercase tracking-widest text-gray-500">Документы</p>
        {[
          { key: 'terms', label: 'Пользовательское соглашение' },
          { key: 'privacy', label: 'Политика конфиденциальности' },
        ].map(doc => (
          <button key={doc.key} onClick={() => setOpenDoc(doc.key)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors">
            <span className="text-sm text-gray-300">{doc.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-600">
              <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

function DocScreen({ doc, onBack }) {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-[#1f2937]">
        <button onClick={onBack} className="text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="font-display font-bold text-white text-sm">{doc.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {doc.content.map((section, i) => (
          <div key={i} className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 space-y-2">
            <h3 className="font-display font-bold text-sm text-[#f59e0b]">{section.heading}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{section.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

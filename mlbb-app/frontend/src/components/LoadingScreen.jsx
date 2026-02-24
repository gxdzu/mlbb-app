import React from 'react'

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0d14]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-display text-xl text-[#f59e0b] tracking-widest uppercase">MLBB</p>
        <p className="text-sm text-gray-500">Загрузка...</p>
      </div>
    </div>
  )
}

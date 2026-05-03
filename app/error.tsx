'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 p-4"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: '#FEF2F2' }}
      >
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <div className="text-center max-w-sm">
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
          Algo deu errado
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Ocorreu um erro inesperado. Tente recarregar a página.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100"
          style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          Ir ao início
        </a>
      </div>
    </div>
  )
}

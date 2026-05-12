'use client'

import Link from 'next/link'

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Visão geral</div>
          <div className="text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>Gerencie empresas, planos e assinaturas</div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/empresas"
            className="px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'rgba(59,130,246,.18)',
              border: '1px solid rgba(59,130,246,.26)',
              color: 'rgba(255,255,255,.92)',
            }}
          >
            Ver empresas
          </Link>
          <Link
            href="/admin/planos"
            className="px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.08)',
              color: 'rgba(255,255,255,.88)',
            }}
          >
            Ver planos
          </Link>
        </div>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.06)',
        }}
      >
        <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Próximo passo</div>
        <div className="mt-1 text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>
          Crie planos com limites e habilite recursos (WhatsApp, IA, Karis Link) para cada empresa.
        </div>
      </div>
    </div>
  )
}


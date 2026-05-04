'use client'

import Link from 'next/link'

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: 'blue' | 'emerald' | 'amber' }) {
  const tones: Record<string, { a: string; b: string; border: string }> = {
    blue: { a: 'rgba(59,130,246,.18)', b: 'rgba(59,130,246,.06)', border: 'rgba(59,130,246,.25)' },
    emerald: { a: 'rgba(16,185,129,.16)', b: 'rgba(16,185,129,.06)', border: 'rgba(16,185,129,.22)' },
    amber: { a: 'rgba(245,158,11,.16)', b: 'rgba(245,158,11,.06)', border: 'rgba(245,158,11,.22)' },
  }
  const t = tones[tone]
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: `linear-gradient(180deg, ${t.a}, ${t.b})`,
        border: `1px solid ${t.border}`,
      }}
    >
      <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'rgba(155,178,209,.92)' }}>{label}</div>
      <div className="mt-2 text-2xl font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>{value}</div>
      <div className="mt-1 text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>{hint}</div>
    </div>
  )
}

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Empresas" value="—" hint="Total cadastrado" tone="blue" />
        <StatCard label="Assinaturas" value="—" hint="Ativas / trial / canceladas" tone="emerald" />
        <StatCard label="Uso" value="—" hint="Usuários / conversas / mensagens" tone="amber" />
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


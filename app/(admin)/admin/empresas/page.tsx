'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'
import type { AdminCompany } from '@/lib/types'

function Pill({ children, tone }: { children: React.ReactNode; tone: 'blue' | 'emerald' | 'amber' | 'gray' }) {
  const tones: Record<string, { bg: string; border: string; color: string }> = {
    blue: { bg: 'rgba(59,130,246,.14)', border: 'rgba(59,130,246,.22)', color: 'rgba(255,255,255,.92)' },
    emerald: { bg: 'rgba(16,185,129,.14)', border: 'rgba(16,185,129,.22)', color: 'rgba(255,255,255,.92)' },
    amber: { bg: 'rgba(245,158,11,.14)', border: 'rgba(245,158,11,.22)', color: 'rgba(255,255,255,.92)' },
    gray: { bg: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.10)', color: 'rgba(255,255,255,.86)' },
  }
  const t = tones[tone]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}>
      {children}
    </span>
  )
}

export default function AdminCompaniesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await api.adminListCompanies({ search: search.trim() || undefined, take: 100 })
      setCompanies(res.companies)
    } catch (e: any) {
      toast(e.message || 'Erro ao carregar empresas', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return companies
    return companies.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
  }, [companies, search])

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Empresas</div>
          <div className="text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>Gestão de tenants e configurações</div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou ID"
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              width: 280,
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)',
              color: 'rgba(255,255,255,.92)',
            }}
          />
          <button
            onClick={load}
            className="px-3 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: 'rgba(59,130,246,.18)',
              border: '1px solid rgba(59,130,246,.26)',
              color: 'rgba(255,255,255,.92)',
            }}
            disabled={loading}
          >
            Atualizar
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}
      >
        <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold"
          style={{ color: 'rgba(155,178,209,.92)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div className="col-span-5">Empresa</div>
          <div className="col-span-3">Plano</div>
          <div className="col-span-2">Recursos</div>
          <div className="col-span-2 text-right">Uso</div>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-sm" style={{ color: 'rgba(155,178,209,.92)' }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-sm" style={{ color: 'rgba(155,178,209,.92)' }}>Nenhuma empresa encontrada.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
            {filtered.map(c => {
              const planName = c.subscription?.plan?.name ?? 'Sem plano'
              const status = c.subscription?.status ?? null
              return (
                <Link
                  key={c.id}
                  href={`/admin/empresas/${c.id}`}
                  className="grid grid-cols-12 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="col-span-5 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,.92)' }}>{c.name}</div>
                    <div className="text-[11px] truncate" style={{ color: 'rgba(155,178,209,.92)' }}>{c.id}</div>
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <Pill tone={status === 'ACTIVE' ? 'emerald' : status === 'TRIAL' ? 'blue' : status ? 'amber' : 'gray'}>
                      {planName}
                    </Pill>
                  </div>

                  <div className="col-span-2 flex items-center gap-1 flex-wrap">
                    {c.whatsappEnabled ? <Pill tone="emerald">WhatsApp</Pill> : <Pill tone="gray">WhatsApp</Pill>}
                    {c.aiEnabled ? <Pill tone="blue">IA</Pill> : <Pill tone="gray">IA</Pill>}
                  </div>

                  <div className="col-span-2 text-right">
                    <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,.90)' }}>
                      {c._count ? `${c._count.users} usuários` : '—'}
                    </div>
                    <div className="text-[11px]" style={{ color: 'rgba(155,178,209,.92)' }}>
                      {c._count ? `${c._count.conversations} conv.` : ''}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'
import type { Plan } from '@/lib/types'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
      <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,.88)' }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  )
}

const moduleDefs = [
  { key: 'crmManual', label: 'CRM Manual' },
  { key: 'campanhas', label: 'Campanhas' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'calendario', label: 'Calendário' },
  { key: 'cupons', label: 'Cupons' },
  { key: 'afiliados', label: 'Afiliados' },
  { key: 'remuneracao', label: 'Remuneração' },
  { key: 'agente', label: 'Agente' },
  { key: 'multichat', label: 'Multi-chat' },
] as const

export default function AdminPlansPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [includeInactive, setIncludeInactive] = useState(true)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [karisLinkEnabled, setKarisLinkEnabled] = useState(false)
  const [maxUsers, setMaxUsers] = useState<string>('')
  const [maxWhatsappConnections, setMaxWhatsappConnections] = useState<string>('')
  const [modules, setModules] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(moduleDefs.map(m => [m.key, false]))
  )

  async function load() {
    setLoading(true)
    try {
      const res = await api.adminListPlans(includeInactive)
      setPlans(res.plans)
    } catch (e: any) {
      toast(e.message || 'Erro ao carregar planos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [includeInactive])

  const sorted = useMemo(() => {
    return [...plans].sort((a, b) => (a.isActive === b.isActive ? b.createdAt.localeCompare(a.createdAt) : a.isActive ? -1 : 1))
  }, [plans])

  async function create() {
    setSaving(true)
    try {
      const maxUsersNum = maxUsers.trim() ? Number(maxUsers) : null
      const maxWhatsNum = maxWhatsappConnections.trim() ? Number(maxWhatsappConnections) : null
      await api.adminCreatePlan({
        name,
        description: description || null,
        isActive: true,
        aiEnabled,
        whatsappEnabled,
        karisLinkEnabled,
        features: { modules },
        maxUsers: maxUsersNum !== null && Number.isFinite(maxUsersNum) ? maxUsersNum : null,
        maxWhatsappConnections: maxWhatsNum !== null && Number.isFinite(maxWhatsNum) ? maxWhatsNum : null,
      })
      toast('Plano criado', 'success')
      setName('')
      setDescription('')
      setAiEnabled(true)
      setWhatsappEnabled(true)
      setKarisLinkEnabled(false)
      setMaxUsers('')
      setMaxWhatsappConnections('')
      setModules(Object.fromEntries(moduleDefs.map(m => [m.key, false])))
      await load()
    } catch (e: any) {
      toast(e.message || 'Erro ao criar plano', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: Plan) {
    try {
      if (p.isActive) {
        await api.adminDisablePlan(p.id)
      } else {
        await api.adminUpdatePlan(p.id, { isActive: true })
      }
      await load()
    } catch (e: any) {
      toast(e.message || 'Erro ao atualizar plano', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Planos</div>
          <div className="text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>Defina recursos e limites por assinatura</div>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'rgba(255,255,255,.88)' }}>
          <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} />
          Mostrar inativos
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Novo plano</div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>Nome</div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.92)' }}
              />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>Descrição</div>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.92)' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Toggle checked={whatsappEnabled} onChange={setWhatsappEnabled} label="WhatsApp" />
              <Toggle checked={aiEnabled} onChange={setAiEnabled} label="IA" />
              <Toggle checked={karisLinkEnabled} onChange={setKarisLinkEnabled} label="Link" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>Max. usuários</div>
                <input
                  value={maxUsers}
                  onChange={e => setMaxUsers(e.target.value)}
                  placeholder="ex.: 5"
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.92)' }}
                />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>Max. conexões WhatsApp</div>
                <input
                  value={maxWhatsappConnections}
                  onChange={e => setMaxWhatsappConnections(e.target.value)}
                  placeholder="ex.: 1"
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.92)' }}
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'rgba(155,178,209,.92)' }}>Módulos</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {moduleDefs.map(m => (
                  <Toggle
                    key={m.key}
                    checked={Boolean(modules[m.key])}
                    onChange={v => setModules(prev => ({ ...prev, [m.key]: v }))}
                    label={m.label}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={create}
              className="w-full px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(59,130,246,.18)', border: '1px solid rgba(59,130,246,.26)', color: 'rgba(255,255,255,.92)' }}
              disabled={saving || !name.trim()}
            >
              Criar plano
            </button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="px-4 py-3 text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            Planos cadastrados
          </div>
          {loading ? (
            <div className="px-4 py-10 text-sm" style={{ color: 'rgba(155,178,209,.92)' }}>Carregando…</div>
          ) : sorted.length === 0 ? (
            <div className="px-4 py-10 text-sm" style={{ color: 'rgba(155,178,209,.92)' }}>Nenhum plano.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
              {sorted.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,.92)' }}>
                      {p.name}
                      {!p.isActive && <span className="ml-2 text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>(inativo)</span>}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'rgba(155,178,209,.92)' }}>{p.description ?? ''}</div>
                    <div className="mt-1 text-[11px]" style={{ color: 'rgba(155,178,209,.92)' }}>
                      {p.whatsappEnabled ? 'WhatsApp' : '—'} · {p.aiEnabled ? 'IA' : '—'} · {p.karisLinkEnabled ? 'Link' : '—'}
                      {p.features?.modules && typeof p.features.modules === 'object'
                        ? ` · ${Object.values(p.features.modules).filter(Boolean).length} módulos`
                        : ''}
                      {typeof p.maxUsers === 'number' ? ` · ${p.maxUsers} usuários` : ''}
                      {typeof p.maxWhatsappConnections === 'number' ? ` · ${p.maxWhatsappConnections} WA` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(p)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      background: p.isActive ? 'rgba(239,68,68,.16)' : 'rgba(16,185,129,.14)',
                      border: p.isActive ? '1px solid rgba(239,68,68,.22)' : '1px solid rgba(16,185,129,.22)',
                      color: 'rgba(255,255,255,.92)',
                      flexShrink: 0,
                    }}
                  >
                    {p.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

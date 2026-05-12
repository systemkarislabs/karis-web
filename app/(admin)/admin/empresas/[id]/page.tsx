'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'
import type { AdminCompany, Plan, SubscriptionStatus } from '@/lib/types'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>{children}</div>
}

export default function AdminCompanyPage() {
  const { toast } = useToast()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = String(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState<AdminCompany | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])

  const [name, setName] = useState('')
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [karisLinkEnabled, setKarisLinkEnabled] = useState(true)
  const [planId, setPlanId] = useState<string>('')
  const [status, setStatus] = useState<SubscriptionStatus>('TRIAL')
  const [applyPlanToCompany, setApplyPlanToCompany] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [c, p] = await Promise.all([
        api.adminGetCompany(id),
        api.adminListPlans(true),
      ])
      setCompany(c.company)
      setPlans(p.plans)
      setName(c.company.name)
      setWhatsappEnabled(c.company.whatsappEnabled)
      setAiEnabled(c.company.aiEnabled)
      setKarisLinkEnabled(c.company.karisLinkEnabled)
      setPlanId(c.company.subscription?.planId ?? '')
      setStatus((c.company.subscription?.status as SubscriptionStatus) ?? 'TRIAL')
    } catch (e: any) {
      toast(e.message || 'Erro ao carregar empresa', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const currentPlan = useMemo(() => plans.find(p => p.id === planId) ?? null, [plans, planId])

  async function save() {
    setSaving(true)
    try {
      await api.adminUpdateCompany(id, { name, whatsappEnabled, aiEnabled, karisLinkEnabled })
      if (planId) {
        await api.adminUpsertCompanySubscription(id, { planId, status, applyPlanToCompany })
      }
      toast('Empresa atualizada', 'success')
      await load()
    } catch (e: any) {
      toast(e.message || 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>{loading ? 'Empresa' : company?.name}</div>
          <div className="text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>{id}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.88)' }}
          >
            Voltar
          </button>
          <button
            onClick={save}
            className="px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(59,130,246,.18)', border: '1px solid rgba(59,130,246,.26)', color: 'rgba(255,255,255,.92)' }}
            disabled={saving || loading}
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Dados</div>
          <div className="mt-4 space-y-3">
            <div>
              <FieldLabel>Nome</FieldLabel>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.92)' }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'rgba(255,255,255,.88)' }}>
                <input type="checkbox" checked={whatsappEnabled} onChange={e => setWhatsappEnabled(e.target.checked)} />
                WhatsApp
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'rgba(255,255,255,.88)' }}>
                <input type="checkbox" checked={aiEnabled} onChange={e => setAiEnabled(e.target.checked)} />
                IA
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'rgba(255,255,255,.88)' }}>
                <input type="checkbox" checked={karisLinkEnabled} onChange={e => setKarisLinkEnabled(e.target.checked)} />
                Link
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Assinatura</div>
          <div className="mt-4 space-y-3">
            <div>
              <FieldLabel>Plano</FieldLabel>
              <select
                value={planId}
                onChange={e => setPlanId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.92)' }}
              >
                <option value="">Sem plano</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {currentPlan && (
                <div className="mt-2 text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>
                  {currentPlan.whatsappEnabled ? 'WhatsApp' : '—'} · {currentPlan.aiEnabled ? 'IA' : '—'} · {currentPlan.karisLinkEnabled ? 'Link' : '—'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel>Status</FieldLabel>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as SubscriptionStatus)}
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.92)' }}
                >
                  <option value="TRIAL">TRIAL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold mt-6" style={{ color: 'rgba(255,255,255,.88)' }}>
                <input type="checkbox" checked={applyPlanToCompany} onChange={e => setApplyPlanToCompany(e.target.checked)} />
                Aplicar plano na empresa
              </label>
            </div>
          </div>
        </div>
      </div>

      {company?._count && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Usuários', value: company._count.users },
            { label: 'Contatos', value: company._count.contacts },
            { label: 'Conversas', value: company._count.conversations },
            { label: 'Mensagens', value: company._count.messages },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>{s.label}</div>
              <div className="mt-2 text-xl font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Link2, Plus, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import type { Appointment, GoogleIntegrationStatus } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SectionHeader } from '@/components/ui/SectionHeader'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDay(value: Date) {
  return value.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).replace('.', '')
}

export default function CalendarioPage() {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [form, setForm] = useState({ title: '', startAt: '', endAt: '' })

  const range = useMemo(() => {
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
    return { timeMin, timeMax }
  }, [])

  const weekDays = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now)
      date.setDate(now.getDate() + index)
      return date
    })
  }, [])

  async function refreshAll() {
    const s = await api.getGoogleStatus()
    setStatus(s)

    const ap = await api.getAppointments()
    setAppointments(ap.appointments ?? [])

    if (s.connected) {
      const ev = await api.getGoogleEvents({ timeMin: range.timeMin, timeMax: range.timeMax, maxResults: 20 })
      setEvents(ev.events ?? [])
    } else {
      setEvents([])
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refreshAll()
    } catch { /* noop */ }
    finally { setRefreshing(false) }
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    refreshAll()
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  async function handleConnect() {
    setConnecting(true)
    try {
      const { url } = await api.getGoogleAuthUrl()
      window.location.href = url
    } catch { /* noop */ }
    finally { setConnecting(false) }
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar Google Calendar?')) return
    try {
      await api.disconnectGoogle()
      await refreshAll()
    } catch { /* noop */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.startAt || !form.endAt) return
    setCreating(true)
    try {
      await api.createAppointment({
        title: form.title.trim(),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      })
      setForm({ title: '', startAt: '', endAt: '' })
      await refreshAll()
    } catch { /* noop */ }
    finally { setCreating(false) }
  }

  function renderEventTime(ev: any) {
    const start = ev?.start?.dateTime || ev?.start?.date
    const end = ev?.end?.dateTime || ev?.end?.date
    if (!start) return ''
    const s = new Date(start)
    const e = end ? new Date(end) : null
    return `${formatDateTime(s.toISOString())}${e ? ` -> ${formatDateTime(e.toISOString())}` : ''}`
  }

  const nextSystemAppointment = appointments
    .slice()
    .sort((a, b) => a.startAt.localeCompare(b.startAt))[0]

  return (
    <div className="ops-designer-page calendar-designer-page flex flex-col gap-4">
      <SectionHeader
        title={'Calend\u00e1rio'}
        description={'Agenda comercial, Google Calendar e compromissos do atendimento'}
        right={
          <Button variant="ghost" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw size={15} aria-hidden="true" />
            Atualizar
          </Button>
        }
      />

      <div className="calendar-premium-grid">
        <Card className="calendar-hero-card">
          <div className="calendar-hero-top">
            <div>
              <p>Agenda Karis</p>
              <h2>{nextSystemAppointment ? nextSystemAppointment.title : 'Nenhum compromisso urgente'}</h2>
              <span>
                {nextSystemAppointment
                  ? `${formatDateTime(nextSystemAppointment.startAt)} -> ${formatDateTime(nextSystemAppointment.endAt)}`
                  : 'Crie um agendamento para organizar a opera\u00e7\u00e3o.'}
              </span>
            </div>
            <div className={status?.connected ? 'calendar-status-pill online' : 'calendar-status-pill'}>
              <CheckCircle2 size={14} aria-hidden="true" />
              {status?.connected ? 'Google conectado' : 'Google offline'}
            </div>
          </div>

          <div className="calendar-week-strip">
            {weekDays.map((day, index) => (
              <div key={day.toISOString()} className={index === 0 ? 'active' : ''}>
                <span>{formatDay(day).split(' ')[0]}</span>
                <strong>{day.getDate().toString().padStart(2, '0')}</strong>
              </div>
            ))}
          </div>

          <div className="calendar-insight-row">
            <div>
              <Clock3 size={16} aria-hidden="true" />
              <span>Janela monitorada</span>
              <strong>14 dias</strong>
            </div>
            <div>
              <CalendarDays size={16} aria-hidden="true" />
              <span>Eventos Google</span>
              <strong>{events.length}</strong>
            </div>
            <div>
              <Plus size={16} aria-hidden="true" />
              <span>Agendamentos</span>
              <strong>{appointments.length}</strong>
            </div>
          </div>
        </Card>

        <Card className="calendar-connect-card">
          <div className="calendar-card-head">
            <div>
              <p>Integra\u00e7\u00e3o</p>
              <h3>Google Calendar</h3>
            </div>
            <Link2 size={18} aria-hidden="true" />
          </div>
          <div className="calendar-connect-state">
            <strong>{status?.connected ? 'Conectado' : 'N\u00e3o conectado'}</strong>
            <span>
              {status && !status.hasGoogleConfig
                ? 'OAuth n\u00e3o configurado no servidor.'
                : status?.connected
                  ? 'Eventos externos aparecem automaticamente na agenda.'
                  : 'Conecte para sincronizar os eventos do Google.'}
            </span>
          </div>
          {status?.connected ? (
            <Button variant="danger" onClick={handleDisconnect}>
              Desconectar
            </Button>
          ) : (
            <Button variant="primary" loading={connecting} onClick={handleConnect} disabled={status?.hasGoogleConfig === false}>
              Conectar Google
            </Button>
          )}
        </Card>
      </div>

      <div className="calendar-work-grid">
        <Card className="calendar-form-panel">
          <div className="calendar-card-head">
            <div>
              <p>Novo</p>
              <h3>Agendamento</h3>
            </div>
            <Plus size={18} aria-hidden="true" />
          </div>

          <form onSubmit={handleCreate} className="calendar-form">
            <label>
              <span>T\u00edtulo</span>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                placeholder={'Ex: Reuni\u00e3o com cliente'}
              />
            </label>
            <div className="calendar-form-split">
              <label>
                <span>In\u00edcio</span>
                <Input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} required />
              </label>
              <label>
                <span>Fim</span>
                <Input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} required />
              </label>
            </div>
            <Button type="submit" variant="primary" loading={creating}>
              Criar agendamento
            </Button>
            <p>Se o Google estiver conectado, o evento tamb\u00e9m \u00e9 criado no Calendar.</p>
          </form>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="ui-spinner" />
          </div>
        ) : (
          <div className="calendar-lists-grid">
            <Card className="calendar-list-panel">
              <div className="calendar-card-head">
                <div>
                  <p>Google</p>
                  <h3>Pr\u00f3ximos eventos</h3>
                </div>
                <span>{events.length}</span>
              </div>
              {!status?.connected ? (
                <EmptyState title="Google n\u00e3o conectado" description="Conecte sua conta para ver os eventos." className="border-2 border-dashed" />
              ) : events.length === 0 ? (
                <EmptyState title="Sem eventos" description="N\u00e3o h\u00e1 eventos no per\u00edodo selecionado." className="border-2 border-dashed" />
              ) : (
                <div className="calendar-event-list">
                  {events.slice(0, 12).map((ev: any) => (
                    <div key={ev.id} className="calendar-event-row">
                      <span />
                      <div>
                        <strong>{ev.summary ?? 'Sem t\u00edtulo'}</strong>
                        <p>{renderEventTime(ev)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="calendar-list-panel">
              <div className="calendar-card-head">
                <div>
                  <p>Sistema</p>
                  <h3>Agendamentos</h3>
                </div>
                <span>{appointments.length}</span>
              </div>
              {appointments.length === 0 ? (
                <EmptyState title="Sem agendamentos" description="Crie um agendamento para come\u00e7ar." className="border-2 border-dashed" />
              ) : (
                <div className="calendar-event-list">
                  {appointments.slice(0, 12).map(a => (
                    <div key={a.id} className="calendar-event-row system">
                      <span />
                      <div>
                        <strong>{a.title}</strong>
                        <p>{formatDateTime(a.startAt)} {'->'} {formatDateTime(a.endAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import {
  Bot, Calendar, Check, ChevronRight, Clock, ExternalLink,
  Mail, Shield, Users, Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useToast } from '@/components/Toast'
import type { FollowUpSetting, GoogleIntegrationStatus, User } from '@/lib/types'

type Tab = 'conta' | 'equipe' | 'automacao' | 'integracoes'

const TABS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'conta',       label: 'Minha conta',  icon: <Shield size={15} />,   desc: 'Perfil e acesso' },
  { id: 'equipe',      label: 'Equipe',        icon: <Users size={15} />,    desc: 'Usuários e papéis' },
  { id: 'automacao',   label: 'Automação',     icon: <Zap size={15} />,      desc: 'Follow-up automático' },
  { id: 'integracoes', label: 'Integrações',   icon: <Calendar size={15} />, desc: 'Google Calendar' },
]

// ── Conta ─────────────────────────────────────────────────────────────────────
function ContaPanel() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('karisCurrentUser')
      if (raw) setUser(JSON.parse(raw))
    } catch (err: any) { console.error('Operation failed:', err?.message || err) }
  }, [])

  const roleLabel =
    user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'AGENT' ? 'Agente' : user?.role ?? '—'

  return (
    <div className="cfg-content">
      <div className="cfg-section-head">
        <h2>Minha conta</h2>
        <p>Informações do seu perfil e acesso ao sistema.</p>
      </div>

      <div className="cfg-field-list">
        <div className="cfg-field">
          <label>Nome</label>
          <div className="cfg-field-val">{user?.name ?? '—'}</div>
        </div>
        <div className="cfg-field">
          <label>E-mail</label>
          <div className="cfg-field-val">{user?.email ?? '—'}</div>
        </div>
        <div className="cfg-field">
          <label>Papel</label>
          <div className="cfg-field-val">
            <span className={`cfg-role-badge ${user?.role?.toLowerCase() ?? ''}`}>{roleLabel}</span>
          </div>
        </div>
      </div>

      <div className="cfg-action-row">
        <a href="/recuperar-senha" className="cfg-link-btn">
          <Mail size={14} />
          Alterar senha por e-mail
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}

// ── Equipe ────────────────────────────────────────────────────────────────────
function EquipePanel() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getUsers()
      .then(d => setUsers(d.users ?? []))
      .catch((err: any) => { console.error('Operation failed:', err?.message || err) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="cfg-content">
      <div className="cfg-section-head">
        <h2>Equipe</h2>
        <p>Membros com acesso ao Karis Atende.</p>
      </div>

      {loading ? (
        <div className="cfg-loading"><div className="ui-spinner" /></div>
      ) : users.length === 0 ? (
        <p className="cfg-empty">Nenhum usuário encontrado.</p>
      ) : (
        <ul className="cfg-user-list">
          {users.map(u => (
            <li key={u.id} className="cfg-user-row">
              <div className="cfg-user-av">{u.name.charAt(0).toUpperCase()}</div>
              <div className="cfg-user-info">
                <strong>{u.name}</strong>
                <span>{u.email}</span>
              </div>
              <span className={`cfg-role-badge ${u.role.toLowerCase()}`}>
                {u.role === 'ADMIN' ? 'Admin' : 'Agente'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Automação ─────────────────────────────────────────────────────────────────
function AutomacaoPanel() {
  const { toast } = useToast()
  const [setting, setSetting] = useState<FollowUpSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getFollowUpSetting()
      .then(d => setSetting(d.setting))
      .catch((err: any) => { console.error('Operation failed:', err?.message || err) })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!setting) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.updateFollowUpSetting({
        enabled: setting.enabled,
        delayMinutes: setting.delayMinutes,
      })
      setSetting(updated.setting)
      setSaved(true)
      toast('Configuração salva', 'success')
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast('Erro ao salvar configuração', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cfg-content">
      <div className="cfg-section-head">
        <h2>Follow-up automático</h2>
        <p>
          Quando um cliente não responde, a IA envia uma mensagem de acompanhamento
          automaticamente após o tempo configurado.
        </p>
      </div>

      {loading ? (
        <div className="cfg-loading"><div className="ui-spinner" /></div>
      ) : !setting ? (
        <p className="cfg-empty">Não foi possível carregar as configurações.</p>
      ) : (
        <div className="cfg-form">
          {/* Toggle */}
          <div className="cfg-toggle-row">
            <div>
              <strong>Ativar follow-up automático</strong>
              <span>
                A IA envia uma mensagem de acompanhamento quando o cliente fica sem responder.
                O follow-up é cancelado automaticamente se o cliente responder antes.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSetting(s => s ? { ...s, enabled: !s.enabled } : s)}
              className={`cfg-toggle${setting.enabled ? ' on' : ''}`}
              aria-pressed={setting.enabled}
              aria-label={setting.enabled ? 'Desativar follow-up' : 'Ativar follow-up'}
            >
              <span />
            </button>
          </div>

          {/* Delay */}
          {setting.enabled && (
            <div className="cfg-delay-block">
              <label>Tempo de espera sem resposta</label>
              <div className="cfg-delay-opts">
                {([15, 30, 45] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSetting(s => s ? { ...s, delayMinutes: d } : s)}
                    className={`cfg-delay-btn${setting.delayMinutes === d ? ' active' : ''}`}
                  >
                    <Clock size={13} />
                    {d} minutos
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="cfg-save-row">
            <Button variant="primary" onClick={save} loading={saving}>
              Salvar configuração
            </Button>
            {saved && (
              <span className="cfg-saved-ok">
                <Check size={14} />
                Salvo
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Integrações ───────────────────────────────────────────────────────────────
function IntegracoesPanel() {
  const { toast } = useToast()
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    api.getGoogleStatus()
      .then(setStatus)
      .catch((err: any) => { console.error('Operation failed:', err?.message || err) })
      .finally(() => setLoading(false))
  }, [])

  async function connect() {
    setConnecting(true)
    try {
      const { url } = await api.getGoogleAuthUrl()
      window.location.href = url
    } catch {
      toast('Erro ao obter URL de autenticação do Google', 'error')
      setConnecting(false)
    }
  }

  async function disconnect() {
    setDisconnecting(true)
    try {
      await api.disconnectGoogle()
      setStatus(s => s ? { ...s, connected: false, googleCalendarId: null } : s)
      toast('Google Calendar desconectado', 'success')
    } catch {
      toast('Erro ao desconectar', 'error')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="cfg-content">
      <div className="cfg-section-head">
        <h2>Integrações</h2>
        <p>Conecte serviços externos para expandir as funcionalidades do Karis Atende.</p>
      </div>

      {loading ? (
        <div className="cfg-loading"><div className="ui-spinner" /></div>
      ) : (
        <div className="cfg-integration-card">
          <div className="cfg-int-icon">
            <Calendar size={22} />
          </div>
          <div className="cfg-int-info">
            <strong>Google Calendar</strong>
            <span>
              {status?.connected
                ? `Conectado${status.googleCalendarId ? ` · ${status.googleCalendarId}` : ''}`
                : 'Sincronize agendamentos criados pelo Karis com sua agenda do Google.'}
            </span>
          </div>
          <div className="cfg-int-action">
            {status?.connected ? (
              <Button variant="danger" onClick={disconnect} loading={disconnecting}>
                Desconectar
              </Button>
            ) : (
              <Button variant="primary" onClick={connect} loading={connecting}>
                Conectar Google
              </Button>
            )}
          </div>
          {status?.connected && (
            <div className="cfg-int-status">
              <span className="cfg-online-dot" />
              Conectado e sincronizando
            </div>
          )}
        </div>
      )}

      {/* Atalhos rápidos */}
      <div className="cfg-shortcuts">
        <p className="cfg-shortcuts-label">Atalhos rápidos</p>
        <div className="cfg-shortcuts-grid">
          {[
            { href: '/ia', icon: <Bot size={16} />, label: 'Configurar agente IA', desc: 'Personalidade, instruções e transferência' },
            { href: '/whatsapp', icon: <Calendar size={16} />, label: 'Conexão WhatsApp', desc: 'QR code e status de instância' },
            { href: '/crm', icon: <Zap size={16} />, label: 'Pipeline CRM', desc: 'Estágios e automações de vendas' },
          ].map(s => (
            <a key={s.href} href={s.href} className="cfg-shortcut-card">
              <span className="cfg-shortcut-icon">{s.icon}</span>
              <div>
                <strong>{s.label}</strong>
                <span>{s.desc}</span>
              </div>
              <ChevronRight size={14} className="cfg-shortcut-arrow" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('conta')

  const panels: Record<Tab, React.ReactNode> = {
    conta:       <ContaPanel />,
    equipe:      <EquipePanel />,
    automacao:   <AutomacaoPanel />,
    integracoes: <IntegracoesPanel />,
  }

  return (
    <div className="ops-designer-page">
      <SectionHeader
        title="Configurações"
        description="Gerencie sua conta, equipe e integrações."
      />

      <div className="cfg-layout">
        {/* Sidebar de navegação */}
        <nav className="cfg-nav" aria-label="Seções de configuração">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`cfg-nav-item${tab === t.id ? ' active' : ''}`}
            >
              <span className="cfg-nav-icon">{t.icon}</span>
              <div className="cfg-nav-text">
                <strong>{t.label}</strong>
                <span>{t.desc}</span>
              </div>
              {tab === t.id && <ChevronRight size={13} className="cfg-nav-arrow" />}
            </button>
          ))}
        </nav>

        {/* Painel de conteúdo */}
        <div className="cfg-panel">
          {panels[tab]}
        </div>
      </div>
    </div>
  )
}

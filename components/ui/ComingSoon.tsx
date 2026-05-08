'use client'

import Link from 'next/link'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Settings2,
  Sparkles,
  UserRound,
} from 'lucide-react'

const quickStats = [
  { label: 'Fluxos ativos', value: '8', tone: 'brand' },
  { label: 'Pend\u00eancias', value: '3', tone: 'light' },
  { label: 'Sa\u00fade', value: '96%', tone: 'light' },
]

export function ComingSoon({ title }: { title: string }) {
  const isSettings = title.toLowerCase().includes('config')

  return (
    <section className="dashboard-shell">
      <div className="finance-page-head">
        <div>
          <p className="finance-kicker">{isSettings ? 'User Profile' : 'Budget Management'}</p>
          <h1>{title}</h1>
          <span>{'Opera\u00e7\u00e3o Karis Atende'}</span>
        </div>
      </div>

      <div className="settings-reference-grid">
        <aside className="settings-tabs">
          {[
            [UserRound, 'Perfil'],
            [Settings2, 'Prefer\u00eancias'],
            [CalendarDays, 'Agenda'],
            [CreditCard, title],
          ].map(([Icon, label], index) => (
            <div key={String(label)} className={index === 0 ? 'active' : ''}>
              <Icon size={14} />
              <span>{String(label)}</span>
            </div>
          ))}
        </aside>

        <div className="settings-reference-panel">
          <div className="settings-panel-head">
            <div>
              <h2>{isSettings ? 'Account Settings' : 'Resumo da \u00e1rea'}</h2>
              <p>
                {isSettings
                  ? 'Gerencie dados, prefer\u00eancias e seguran\u00e7a do ambiente.'
                  : '\u00c1rea preparada para receber a fun\u00e7\u00e3o mantendo o visual premium da Karis.'}
              </p>
            </div>
            <span className="settings-status">
              <CheckCircle2 size={14} />
              Skin aplicada
            </span>
          </div>

          <div className="finance-mini-grid">
            {quickStats.map(stat => (
              <div key={stat.label} className={stat.tone === 'brand' ? 'finance-mini-card brand' : 'finance-mini-card'}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          <div className="reference-preview">
            <div className="reference-chart" aria-hidden="true">
              {[42, 58, 48, 72, 64, 86, 76].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="reference-actions">
              <Sparkles size={18} />
              <strong>{'Pr\u00f3xima implementa\u00e7\u00e3o'}</strong>
              <p>{'Estrutura visual alinhada \u00e0s refer\u00eancias: rail compacto, painel claro, acento Karis e cards densos.'}</p>
            </div>
          </div>

          <div className="settings-actions">
            <Link href="/" className="reference-btn dark">
              <BarChart3 size={14} />
              Dashboard
            </Link>
            <Link href="/multi-chat" className="reference-btn">
              Multi Chat
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

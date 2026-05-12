'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bot, Brain, Database, MessageSquareText } from 'lucide-react'
import { api } from '@/lib/api'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { IaTabs } from '@/components/ui/IaTabs'
import { AssistantSettingsPanel } from '@/components/ui/AssistantSettingsPanel'
import { KnowledgeBasePanel } from '@/components/ui/KnowledgeBasePanel'
import { TrainingPanel } from '@/components/ui/TrainingPanel'

type IaTab = 'agente' | 'conhecimento'

export default function IaClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [agentName, setAgentName] = useState<string>('')

  const tab = useMemo<IaTab>(() => {
    const raw = (sp.get('tab') ?? '').toLowerCase()
    if (raw === 'conhecimento') return 'conhecimento'
    return 'agente'
  }, [sp])

  useEffect(() => {
    let alive = true
    api.getMyCompany()
      .then(({ company }) => {
        if (!alive) return
        if (!company.entitlements.ai) {
          router.replace('/')
          setAllowed(false)
          return
        }
        setAllowed(true)
      })
      .catch(() => { if (alive) setAllowed(false) })
    return () => { alive = false }
  }, [router])

  useEffect(() => {
    let alive = true
    api.getAssistant()
      .then(d => { if (alive && d?.assistant?.name) setAgentName(d.assistant.name) })
      .catch((err: any) => { console.error('Operation failed:', err?.message || err) })
    return () => { alive = false }
  }, [])

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ui-spinner" />
      </div>
    )
  }

  if (!allowed) return null

  const descriptions: Record<IaTab, string> = {
    agente: agentName ? `Configure o comportamento e os materiais de aprendizado de ${agentName}` : 'Configure a agente da empresa e seus materiais de aprendizado',
    conhecimento: agentName ? `Gerencie o conhecimento usado por ${agentName}` : 'Gerencie o conhecimento usado pela agente',
  }

  return (
    <div className="ia-designer-page">
      <SectionHeader title="IA" description={descriptions[tab]} />

      <div className="ia-reference-grid">
        <aside className="ia-profile-panel">
          <div className="ia-profile-mark">
            <Bot size={28} aria-hidden="true" />
          </div>
          <p>AI Agent</p>
          <h2>{agentName || 'Karis Assistente'}</h2>
          <span>Atendimento automatizado com contexto de negócio.</span>

          <div className="ia-profile-stats">
            <div>
              <MessageSquareText size={15} aria-hidden="true" />
              <strong>Conversas</strong>
              <span>Respostas guiadas</span>
            </div>
            <div>
              <Database size={15} aria-hidden="true" />
              <strong>Conhecimento</strong>
              <span>Base treinável</span>
            </div>
            <div>
              <Brain size={15} aria-hidden="true" />
              <strong>Treino</strong>
              <span>PDFs e vídeos</span>
            </div>
          </div>
        </aside>

        <section className="ia-workspace-panel">
          <div className="ia-workspace-top">
            <div>
              <p>{tab === 'agente' ? 'Agent Settings' : 'Knowledge Base'}</p>
              <h2>{tab === 'agente' ? 'Controle da agente' : 'Base de conhecimento'}</h2>
            </div>
            <IaTabs />
          </div>

          {tab === 'agente' && (
            <div className="ia-workspace-stack">
              <AssistantSettingsPanel showHint={false} />
              <TrainingPanel />
            </div>
          )}
          {tab === 'conhecimento' && <KnowledgeBasePanel />}
        </section>
      </div>
    </div>
  )
}

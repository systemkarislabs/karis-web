'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { IaTabs } from '@/components/ui/IaTabs'
import { AssistantSettingsPanel } from '@/components/ui/AssistantSettingsPanel'
import { KnowledgeBasePanel } from '@/components/ui/KnowledgeBasePanel'
import { TrainingPanel } from '@/components/ui/TrainingPanel'

type IaTab = 'agente' | 'conhecimento' | 'treinamento'

export default function IaClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [agentName, setAgentName] = useState<string>('')

  const tab = useMemo<IaTab>(() => {
    const raw = (sp.get('tab') ?? '').toLowerCase()
    if (raw === 'conhecimento') return 'conhecimento'
    if (raw === 'treinamento') return 'treinamento'
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
      .catch(() => {})
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
    agente: agentName ? `Configure o comportamento de ${agentName}` : 'Configure o comportamento do agente',
    conhecimento: agentName ? `Gerencie o conhecimento usado por ${agentName}` : 'Gerencie o conhecimento usado pelo agente',
    treinamento: agentName ? `Materiais de aprendizado para ${agentName}` : 'PDFs e vídeos curtos para treinar o agente',
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <SectionHeader title="IA" description={descriptions[tab]} />
      <IaTabs />
      {tab === 'agente' && <AssistantSettingsPanel />}
      {tab === 'conhecimento' && <KnowledgeBasePanel />}
      {tab === 'treinamento' && <TrainingPanel />}
    </div>
  )
}

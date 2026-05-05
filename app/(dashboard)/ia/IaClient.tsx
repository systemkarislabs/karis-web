'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { IaTabs } from '@/components/ui/IaTabs'
import { AssistantSettingsPanel } from '@/components/ui/AssistantSettingsPanel'
import { KnowledgeBasePanel } from '@/components/ui/KnowledgeBasePanel'

type IaTab = 'agente' | 'conhecimento'

export default function IaClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  const tab = useMemo<IaTab>(() => {
    const raw = (sp.get('tab') ?? '').toLowerCase()
    return raw === 'conhecimento' ? 'conhecimento' : 'agente'
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

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ui-spinner" />
      </div>
    )
  }

  if (!allowed) return null

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <SectionHeader title="IA" description={tab === 'agente' ? 'Configure o comportamento do agente' : 'Gerencie o conhecimento usado pelo agente'} />
      <IaTabs />
      {tab === 'agente' ? <AssistantSettingsPanel /> : <KnowledgeBasePanel />}
    </div>
  )
}


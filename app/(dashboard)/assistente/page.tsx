'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AssistentePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/ia?tab=agente')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="ui-spinner" />
    </div>
  )
}

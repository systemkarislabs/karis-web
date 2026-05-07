'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TreinamentoPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/ia?tab=agente')
  }, [router])
  return null
}

import { Suspense } from 'react'
import IaClient from './IaClient'

export default function IaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="ui-spinner" />
        </div>
      }
    >
      <IaClient />
    </Suspense>
  )
}

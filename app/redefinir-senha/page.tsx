import { Suspense } from 'react'
import ResetPasswordClient from './ResetPasswordClient'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div className="ui-spinner" />
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  )
}

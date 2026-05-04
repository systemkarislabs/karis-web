import type { Metadata } from 'next'
import { DM_Mono, DM_Sans } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Karis Atende',
  description: 'Atendimento inteligente via WhatsApp com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${dmSans.variable} ${dmMono.variable} h-full`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

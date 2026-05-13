import type { Metadata } from 'next'
import { Poppins, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--font-sans' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Karis Atende — Atendimento Inteligente',
  description: 'Plataforma de atendimento inteligente via WhatsApp com IA',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${poppins.variable} ${jetbrains.variable} h-full`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Karis Atende',
  description: 'Atendimento inteligente via WhatsApp com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

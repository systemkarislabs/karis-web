'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'
import type { WhatsappConnection } from '@/lib/types'

type Status = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; text: string; label: string; dot: string }> = {
    CONNECTED: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Conectado' },
    CONNECTING: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Conectando…' },
    DISCONNECTED: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF', label: 'Desconectado' },
    ERROR: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Erro' },
  }
  const s = map[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: s.dot, animationPlayState: status === 'CONNECTING' ? 'running' : 'paused' }} />
      {s.label}
    </span>
  )
}

export default function WhatsAppPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('DISCONNECTED')
  const [connection, setConnection] = useState<WhatsappConnection | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getWhatsappStatus()
      setStatus(data.status as Status)
      setConnection(data.connection)
      if (data.connection?.qrCode) setQrCode(data.connection.qrCode)
      if (data.status === 'CONNECTED') setQrCode(null)
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    let alive = true
    api.getMyCompany()
      .then(({ company }) => {
        if (!alive) return
        if (!company.entitlements.whatsapp) {
          router.replace('/')
          return
        }
        fetchStatus().finally(() => { if (alive) setLoading(false) })
      })
      .catch(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [fetchStatus])

  // Poll while connecting
  useEffect(() => {
    if (status === 'CONNECTING') {
      pollRef.current = setInterval(fetchStatus, 4000)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [status, fetchStatus])

  async function handleConnect() {
    setConnecting(true)
    try {
      const data = await api.connectWhatsapp()
      setStatus('CONNECTING')
      if (data.qrCode) {
        setQrCode(data.qrCode)
      } else {
        toast('Conectando… o QR Code aparecerá em instantes. Clique em "Atualizar QR" se demorar.', 'info')
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao conectar WhatsApp', 'error')
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar o WhatsApp? O assistente ficará offline.')) return
    setDisconnecting(true)
    try {
      await api.disconnectWhatsapp()
      setStatus('DISCONNECTED')
      setConnection(null)
      setQrCode(null)
    } catch { /* noop */ }
    finally { setDisconnecting(false) }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>WhatsApp</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Conecte seu número para receber e enviar mensagens</p>
      </div>

      {/* Status card */}
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Status da conexão</p>
                {connection?.phoneNumber && (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Número: {connection.phoneNumber}</p>
                )}
              </div>
              <StatusPill status={status} />
            </div>

            {/* QR Code */}
            {(status === 'CONNECTING' || status === 'DISCONNECTED') && qrCode && (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  Escaneie o QR Code com o WhatsApp do seu celular
                </p>
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: 'white', border: '1px solid var(--border-soft)', display: 'inline-block' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    width={220}
                    height={220}
                    style={{ display: 'block' }}
                  />
                </div>
                <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                  Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                </p>
              </div>
            )}

            {/* Connected info */}
            {status === 'CONNECTED' && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: '#D1FAE5', border: '1px solid #A7F3D0' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#065F46' }}>WhatsApp conectado com sucesso!</p>
                  <p className="text-xs mt-0.5" style={{ color: '#047857' }}>
                    O assistente está ativo e responderá automaticamente as mensagens recebidas.
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {status === 'ERROR' && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm" style={{ color: '#991B1B' }}>Erro na conexão. Tente reconectar.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              {/* DISCONNECTED / ERROR → botão Conectar */}
              {(status === 'DISCONNECTED' || status === 'ERROR') && (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                  </svg>
                  {connecting ? 'Iniciando…' : 'Conectar'}
                </button>
              )}

              {/* CONNECTING → atualizar QR + forçar reconexão */}
              {status === 'CONNECTING' && (
                <>
                  <button
                    onClick={fetchStatus}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Atualizar QR
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 transition-colors hover:bg-yellow-50"
                    style={{ border: '1px solid #F59E0B', color: '#92400E' }}
                  >
                    {connecting ? 'Reconectando…' : 'Forçar reconexão'}
                  </button>
                </>
              )}

              {/* CONNECTED / CONNECTING → Desconectar */}
              {(status === 'CONNECTED' || status === 'CONNECTING') && (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 transition-colors hover:bg-red-50"
                  style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}
                >
                  {disconnecting ? 'Desconectando…' : 'Desconectar'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Instructions card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
      >
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Como conectar</p>
        <ol className="flex flex-col gap-2.5">
          {[
            'Clique em "Conectar" para gerar o QR Code',
            'Abra o WhatsApp no seu celular',
            'Vá em Configurações → Dispositivos conectados → Conectar um dispositivo',
            'Aponte a câmera para o QR Code exibido acima',
            'Aguarde a confirmação de conexão',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--muted)' }}>
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Check, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'
import type { WhatsappConnection, WhatsappDiagnostics } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SectionHeader } from '@/components/ui/SectionHeader'

type Status = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'

function parseVersion(v: string) {
  const parts = v.split('.').map((p) => Number(p))
  return {
    major: Number.isFinite(parts[0]) ? parts[0] : 0,
    minor: Number.isFinite(parts[1]) ? parts[1] : 0,
    patch: Number.isFinite(parts[2]) ? parts[2] : 0,
  }
}

function isLt(a: { major: number; minor: number; patch: number }, b: { major: number; minor: number; patch: number }) {
  if (a.major !== b.major) return a.major < b.major
  if (a.minor !== b.minor) return a.minor < b.minor
  return a.patch < b.patch
}

export default function WhatsAppPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('DISCONNECTED')
  const [connection, setConnection] = useState<WhatsappConnection | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingNumber, setPairingNumber] = useState('')
  const [diagnostics, setDiagnostics] = useState<WhatsappDiagnostics | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDiagnostics = useCallback(async () => {
    try {
      const d = await api.getWhatsappDiagnostics()
      setDiagnostics(d)
    } catch { /* noop */ }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getWhatsappStatus()
      setStatus(data.status as Status)
      setConnection(data.connection)
      if (data.connection?.qrCode) setQrCode(data.connection.qrCode)
      if (data.status === 'CONNECTED') setQrCode(null)
      if (data.status === 'CONNECTED') setPairingCode(null)
      setStatusError(null)
    } catch (e: any) {
      const msg = e?.message || 'Erro ao consultar status do WhatsApp'
      setStatus('ERROR')
      setStatusError(msg)
      fetchDiagnostics().catch(() => {})
    }
  }, [fetchDiagnostics])

  useEffect(() => {
    let alive = true
    api.getMyCompany()
      .then(({ company }) => {
        if (!alive) return
        if (!company.entitlements.whatsapp) {
          router.replace('/')
          return
        }
        Promise.all([fetchStatus(), fetchDiagnostics()]).finally(() => { if (alive) setLoading(false) })
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

  async function handleConnect(number?: string) {
    setConnecting(true)
    try {
      const data = await api.connectWhatsapp(number ? { number } : {})
      setStatus('CONNECTING')
      if (data.qrCode) {
        setQrCode(data.qrCode)
        setPairingCode(null)
      } else if (data.pairingCode) {
        setQrCode(null)
        setPairingCode(data.pairingCode)
      } else {
        toast('Conectando… o QR Code aparecerá em instantes. Clique em "Atualizar QR" se demorar.', 'info')
      }
      fetchDiagnostics().catch(() => {})
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao conectar WhatsApp', 'error')
      setStatus('ERROR')
      setStatusError(err instanceof Error ? err.message : 'Erro ao conectar WhatsApp')
      fetchDiagnostics().catch(() => {})
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
      setStatusError(null)
      fetchDiagnostics().catch(() => {})
    } catch { /* noop */ }
    finally { setDisconnecting(false) }
  }

  async function handleReset() {
    if (!confirm('Resetar a instância? Isso apaga a sessão na Evolution e recria do zero.')) return
    setResetting(true)
    try {
      const data = await api.resetWhatsapp(pairingNumber.trim() ? { number: pairingNumber.trim() } : {})
      setStatus('CONNECTING')
      if (data.qrCode) {
        setQrCode(data.qrCode)
        setPairingCode(null)
      } else if (data.pairingCode) {
        setQrCode(null)
        setPairingCode(data.pairingCode)
      } else {
        toast('Reset efetuado. Aguarde e clique em "Atualizar QR".', 'info')
      }
      fetchDiagnostics().catch(() => {})
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao resetar instância', 'error')
      fetchDiagnostics().catch(() => {})
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <SectionHeader title="WhatsApp" description="Conecte seu número para receber e enviar mensagens" />

      {/* Status card */}
      <Card className="p-6 flex flex-col gap-5">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="ui-spinner" />
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
              <Badge
                dot
                variant={status === 'CONNECTED' ? 'success' : status === 'CONNECTING' ? 'warning' : status === 'ERROR' ? 'danger' : 'neutral'}
              >
                {status === 'CONNECTED' ? 'Conectado' : status === 'CONNECTING' ? 'Conectando…' : status === 'ERROR' ? 'Erro' : 'Desconectado'}
              </Badge>
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
                <Check size={20} aria-hidden="true" color="#065F46" />
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
                <AlertCircle size={20} aria-hidden="true" color="#991B1B" />
                <div className="min-w-0">
                  <p className="text-sm" style={{ color: '#991B1B' }}>Erro na conexão. Tente reconectar.</p>
                  {statusError ? (
                    <p className="text-xs mt-0.5 max-h-20 overflow-auto whitespace-pre-wrap break-words" style={{ color: '#B91C1C' }}>{statusError}</p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              {/* DISCONNECTED / ERROR → botão Conectar */}
              {(status === 'DISCONNECTED' || status === 'ERROR') && (
                <Button
                  onClick={() => handleConnect()}
                  loading={connecting}
                  variant="primary"
                >
                  <ArrowRight size={16} aria-hidden="true" />
                  Conectar
                </Button>
              )}

              {/* CONNECTING → atualizar QR + forçar reconexão */}
              {status === 'CONNECTING' && (
                <>
                  <Button
                    onClick={() => { fetchStatus(); fetchDiagnostics() }}
                    variant="primary"
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                    Atualizar QR
                  </Button>
                  <Button
                    onClick={() => handleConnect()}
                    loading={connecting}
                    variant="ghost"
                    className="!text-[#92400E] !bg-transparent"
                    style={{ border: '1px solid #F59E0B' }}
                  >
                    Forçar reconexão
                  </Button>
                  <Button
                    onClick={handleReset}
                    loading={resetting}
                    variant="ghost"
                    className="!text-[#7C2D12] !bg-transparent"
                    style={{ border: '1px solid #FB923C' }}
                  >
                    Resetar instância
                  </Button>
                </>
              )}

              {/* CONNECTED / CONNECTING → Desconectar */}
              {(status === 'CONNECTED' || status === 'CONNECTING') && (
                <Button
                  onClick={handleDisconnect}
                  loading={disconnecting}
                  variant="danger"
                >
                  Desconectar
                </Button>
              )}
            </div>
          </>
        )}
      </Card>

      {status === 'CONNECTING' && !qrCode && (
        <Card className="p-5">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Alternativa: Código de pareamento</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Se o QR não aparecer, tente gerar um código usando seu número (DDI + DDD + número).
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Input
              value={pairingNumber}
              onChange={(e) => setPairingNumber(e.target.value)}
              placeholder="Ex: 5511999999999"
              inputMode="numeric"
            />
            <Button
              onClick={() => handleConnect(pairingNumber.trim())}
              loading={connecting}
              variant="primary"
              className="sm:w-auto"
            >
              Gerar código
            </Button>
          </div>
          {pairingCode ? (
            <div className="mt-4 p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
              <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Código</div>
              <div className="text-2xl font-semibold tracking-widest" style={{ color: 'var(--text)' }}>{pairingCode}</div>
              <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                No WhatsApp: Dispositivos conectados → Conectar dispositivo → Conectar com número/código.
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {false && diagnostics && (
        <Card className="p-5">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Diagnóstico</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Habilitado</div>
              <div className="font-semibold" style={{ color: 'var(--text)' }}>{diagnostics!.enabled ? 'Sim' : 'Não'}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Configuração</div>
              <div className="font-semibold" style={{ color: 'var(--text)' }}>{diagnostics!.hasEvolutionConfig ? 'OK' : 'Faltando'}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Servidor alcançável</div>
              <div className="font-semibold" style={{ color: 'var(--text)' }}>{diagnostics!.evolutionReachable ? 'Sim' : 'Não'}</div>
            </div>
          </div>

          {diagnostics!.connection?.lastError ? (
            <div className="mt-4 p-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <div className="text-xs font-semibold" style={{ color: '#991B1B' }}>Último erro</div>
              <div className="text-sm mt-1" style={{ color: '#B91C1C', wordBreak: 'break-word' }}>{diagnostics!.connection!.lastError}</div>
            </div>
          ) : null}
        </Card>
      )}

      {/* Instructions card */}
      <Card className="p-5">
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
      </Card>
    </div>
  )
}

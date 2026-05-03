'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'
import type { Contact } from '@/lib/types'

function exportCSV(contacts: Contact[]) {
  const header = ['Nome', 'Telefone', 'E-mail', 'Cadastrado em']
  const rows = contacts.map(c => [
    c.name ?? '',
    c.phone,
    c.email ?? '',
    new Date(c.createdAt).toLocaleDateString('pt-BR'),
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contatos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ContatosPage() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getContacts()
      .then(d => setContacts(d.contacts))
      .catch(() => toast('Erro ao carregar contatos', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return (
      c.phone.includes(q) ||
      (c.name?.toLowerCase().includes(q) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    )
  })

  function handleExport() {
    if (filtered.length === 0) return toast('Nenhum contato para exportar', 'warning')
    exportCSV(filtered)
    toast(`${filtered.length} contatos exportados`, 'success')
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Contatos</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{contacts.length} cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', width: 200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
              className="flex-1 text-sm outline-none bg-transparent" style={{ color: 'var(--text)' }} />
          </div>

          {/* Export */}
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ background: 'var(--teal-soft)', color: 'var(--teal)', border: '1px solid #99F6E4' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {search ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 px-5 py-3 text-xs font-semibold"
              style={{ borderBottom: '1px solid var(--border-soft)', color: 'var(--muted)', background: 'var(--bg)' }}>
              <span className="col-span-4">Nome</span>
              <span className="col-span-4">Telefone</span>
              <span className="col-span-3">E-mail</span>
              <span className="col-span-1 text-right">Desde</span>
            </div>
            <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
              {filtered.map(c => (
                <li key={c.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
                      {(c.name ?? c.phone).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {c.name ?? <span style={{ color: 'var(--muted)' }}>—</span>}
                    </span>
                  </div>
                  <span className="col-span-4 text-sm" style={{ color: 'var(--muted)' }}>{c.phone}</span>
                  <span className="col-span-3 text-sm truncate" style={{ color: 'var(--muted)' }}>{c.email ?? '—'}</span>
                  <span className="col-span-1 text-xs text-right" style={{ color: 'var(--muted)' }}>
                    {new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

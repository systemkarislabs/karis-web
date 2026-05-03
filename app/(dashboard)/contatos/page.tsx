'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Contact } from '@/lib/types'

export default function ContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getContacts()
      .then(d => setContacts(d.contacts))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return (
      c.phone.includes(q) ||
      (c.name?.toLowerCase().includes(q) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Contatos</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{contacts.length} cadastrados</p>
        </div>
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', width: 240 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {search ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
            </p>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              className="grid grid-cols-12 px-5 py-3 text-xs font-semibold"
              style={{ borderBottom: '1px solid var(--border-soft)', color: 'var(--muted)', background: 'var(--bg)' }}
            >
              <span className="col-span-4">Nome</span>
              <span className="col-span-4">Telefone</span>
              <span className="col-span-3">E-mail</span>
              <span className="col-span-1 text-right">Desde</span>
            </div>

            <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
              {filtered.map(c => (
                <li key={c.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  {/* Avatar + name */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
                    >
                      {(c.name ?? c.phone).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {c.name ?? <span style={{ color: 'var(--muted)' }}>—</span>}
                    </span>
                  </div>

                  <span className="col-span-4 text-sm" style={{ color: 'var(--muted)' }}>{c.phone}</span>
                  <span className="col-span-3 text-sm truncate" style={{ color: 'var(--muted)' }}>
                    {c.email ?? '—'}
                  </span>
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

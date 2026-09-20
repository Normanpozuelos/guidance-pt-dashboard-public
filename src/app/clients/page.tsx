'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage, type Language } from '@/lib/LanguageProvider'

function localeFor(language: Language): string {
  return language === 'nb' ? 'nb-NO' : language === 'es' ? 'es-ES' : 'en-GB'
}

interface PtClient {
  id: string
  invite_code: string
  status: string
  created_at: string
  expires_at: string
  code_used_at: string | null
  client: {
    display_name: string | null
    id: string
  } | null
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string | null): string {
  const colors = ['#FF4500', '#FF6B35', '#E63900', '#FF8C00', '#CC3700']
  if (!name) return colors[0]
  return colors[name.charCodeAt(0) % colors.length]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days  = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (weeks < 2) return `${days} days ago`
  return `${weeks} weeks ago`
}

export default function ClientsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [clients, setClients]     = useState<PtClient[]>([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [userId, setUserId]       = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      await fetchClients(session.user.id)
    }
    init()
  }, [router])

  const fetchClients = async (ptId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('pt_clients')
      .select(`
        id, invite_code, status, created_at, expires_at, code_used_at,
        client:client_id (id, display_name)
      `)
      .eq('pt_id', ptId)
      .order('created_at', { ascending: false })

    setClients((data as unknown as PtClient[]) ?? [])
    setLoading(false)
  }

  const generateInviteCode = async () => {
    setGenerating(true)
    try {
      const { data: codeData } = await supabase.rpc('generate_invite_code')
      await supabase.from('pt_clients').insert({
        pt_id:       userId,
        invite_code: codeData,
        status:      'pending',
        expires_at:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      await fetchClients(userId)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const revokeCode = async (clientId: string) => {
    await supabase.from('pt_clients').update({ status: 'revoked' }).eq('id', clientId)
    await fetchClients(userId)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const activeClients  = clients.filter(c => c.status === 'active')
  const pendingClients = clients.filter(c => c.status === 'pending')
  const revokedClients = clients.filter(c => c.status === 'revoked' || c.status === 'expired')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Back
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>
                G
              </div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                Clients
              </h1>
            </div>
          </div>
          <button
            onClick={generateInviteCode}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
          >
            {generating ? '...' : '+ Invite Client'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>

        ) : clients.length === 0 ? (
          // ── Empty state ─────────────────────────────────────────────────────
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              👤
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>No clients yet</h2>
            <p className="mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Generate an invite code and share it with your first client to get started.
            </p>
            <button
              onClick={generateInviteCode}
              disabled={generating}
              className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              {generating ? 'Generating...' : 'Generate First Invite Code'}
            </button>
          </div>

        ) : (
          <div className="space-y-10">

            {/* ── Active clients ────────────────────────────────────────────── */}
            {activeClients.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                    Active Clients
                  </h2>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
                  >
                    {activeClients.length}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeClients.map(client => (
                    <ActiveClientCard
                      key={client.id}
                      client={client}
                      copiedCode={copiedCode}
                      onViewPlans={() => router.push(`/clients/${client.id}`)}
                      onCopy={copyCode}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Pending codes ─────────────────────────────────────────────── */}
            {pendingClients.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                    Pending Invites
                  </h2>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
                  >
                    {pendingClients.length}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingClients.map(client => (
                    <PendingClientCard
                      key={client.id}
                      client={client}
                      language={language}
                      copiedCode={copiedCode}
                      onCopy={copyCode}
                      onRevoke={() => revokeCode(client.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Revoked ───────────────────────────────────────────────────── */}
            {revokedClients.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-lg font-black" style={{ color: 'var(--text-muted)' }}>
                    Revoked / Expired
                  </h2>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                  >
                    {revokedClients.length}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 opacity-40">
                  {revokedClients.map(client => (
                    <PendingClientCard
                      key={client.id}
                      client={client}
                      language={language}
                      copiedCode={copiedCode}
                      onCopy={copyCode}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Active client card ────────────────────────────────────────────────────────

function ActiveClientCard({
  client, copiedCode, onViewPlans, onCopy
}: {
  client: PtClient
  copiedCode: string | null
  onViewPlans: () => void
  onCopy: (code: string) => void
}) {
  const name    = (client as any).client?.display_name ?? 'Unknown'
  const initials = getInitials(name)
  const color    = getAvatarColor(name)
  const isCopied = copiedCode === client.invite_code

  return (
    <div
      className="rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between mb-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0"
            style={{ background: color }}
          >
            {initials}
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--text)' }}>{name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {`Connected ${timeAgo(client.code_used_at ?? client.created_at)}`}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
        >
          Active ✅
        </span>
      </div>

      {/* Invite code */}
      <div
        className="flex items-center justify-between p-3 rounded-xl mb-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Invite code</p>
          <p className="font-mono font-black text-lg tracking-widest" style={{ color: 'var(--primary)' }}>
            {client.invite_code}
          </p>
        </div>
        <button
          onClick={() => onCopy(client.invite_code)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
          style={{ background: 'var(--surface-3)', color: isCopied ? '#22C55E' : 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          {isCopied ? '✅ Copied!' : '📋 Copy'}
        </button>
      </div>

      {/* View plans button */}
      <button
        onClick={onViewPlans}
        className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
      >
        View Plans & Progress →
      </button>
    </div>
  )
}

// ── Pending client card ───────────────────────────────────────────────────────

function PendingClientCard({
  client, language, copiedCode, onCopy, onRevoke
}: {
  client: PtClient
  language: Language
  copiedCode: string | null
  onCopy: (code: string) => void
  onRevoke?: () => void
}) {
  const isCopied  = copiedCode === client.invite_code
  const expiresAt = new Date(client.expires_at).toLocaleDateString(localeFor(language), {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  const isRevoked = client.status === 'revoked' || client.status === 'expired'

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            ⏳
          </div>
          <div>
            <p className="font-bold" style={{ color: 'var(--text)' }}>Waiting for client...</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isRevoked ? 'Revoked' : `Expires ${expiresAt}`}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            background: isRevoked ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
            color: isRevoked ? '#EF4444' : '#F59E0B'
          }}
        >
          {isRevoked ? 'Revoked' : 'Pending'}
        </span>
      </div>

      {/* Code row */}
      <div
        className="flex items-center justify-between p-3 rounded-xl mb-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Invite code</p>
          <p className="font-mono font-black text-lg tracking-widest" style={{ color: isRevoked ? 'var(--text-muted)' : 'var(--primary)' }}>
            {client.invite_code}
          </p>
        </div>
        <button
          onClick={() => onCopy(client.invite_code)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
          style={{ background: 'var(--surface-3)', color: isCopied ? '#22C55E' : 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          {isCopied ? '✅ Copied!' : '📋 Copy'}
        </button>
      </div>

      {/* Revoke button */}
      {onRevoke && !isRevoked && (
        <button
          onClick={onRevoke}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
          style={{ background: 'var(--surface-2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          Revoke Code
        </button>
      )}
    </div>
  )
}
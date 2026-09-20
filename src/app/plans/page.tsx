'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { localeFor, useLanguage } from '@/lib/LanguageProvider'

interface PlanDay {
  id: string
  status: string
}

interface Client {
  id: string
  display_name: string | null
}

interface TrainingPlan {
  id: string
  title: string
  week_start: string
  is_active: boolean
  version_number: number
  notes: string | null
  client: Client | null
  plan_days: PlanDay[]
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

export default function PlansPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [plans, setPlans]     = useState<TrainingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      await fetchPlans(session.user.id)
    }
    init()
  }, [router])

  const fetchPlans = async (ptId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('training_plans')
      .select(`
        id, title, week_start, is_active, version_number, notes,
        client:client_id (id, display_name),
        plan_days (id, status)
      `)
      .eq('pt_id', ptId)
      .order('week_start', { ascending: false })

    setPlans((data as unknown as TrainingPlan[]) ?? [])
    setLoading(false)
  }

  const activePlans   = plans.filter(p => p.is_active)
  const inactivePlans = plans.filter(p => !p.is_active)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium transition-all hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Back
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>
                G
              </div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Training Plans</h1>
            </div>
          </div>
          <button
            onClick={() => router.push('/plans/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
          >
            + New Plan
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>

        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              📋
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>No plans yet</h2>
            <p className="mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Create your first training plan and assign it to a client.
            </p>
            <button
              onClick={() => router.push('/plans/new')}
              className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              Create First Plan
            </button>
          </div>

        ) : (
          <div className="space-y-10">

            {/* ── Active plans ──────────────────────────────────────────────── */}
            {activePlans.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>Active Plans</h2>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
                  >
                    {activePlans.length}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {activePlans.map(plan => (
                    <PlanCard key={plan.id} plan={plan} language={language} onClick={() => router.push(`/plans/${plan.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Previous plans ────────────────────────────────────────────── */}
            {inactivePlans.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-lg font-black" style={{ color: 'var(--text-muted)' }}>Previous Plans</h2>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                  >
                    {inactivePlans.length}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 opacity-50">
                  {inactivePlans.map(plan => (
                    <PlanCard key={plan.id} plan={plan} language={language} onClick={() => router.push(`/plans/${plan.id}`)} />
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

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, language, onClick }: { plan: TrainingPlan; language: import('@/lib/LanguageProvider').Language; onClick: () => void }) {
  const name       = plan.client?.display_name ?? 'No client'
  const initials   = getInitials(name)
  const color      = getAvatarColor(name)
  const weekStart  = new Date(plan.week_start).toLocaleDateString(localeFor(language), {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  // Progress
  const totalDays     = plan.plan_days?.length ?? 0
  const completedDays = plan.plan_days?.filter(d => d.status === 'completed').length ?? 0
  const skippedDays   = plan.plan_days?.filter(d => d.status === 'skipped').length ?? 0
  const pct           = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg w-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0"
            style={{ background: color }}
          >
            {initials}
          </div>
          <div>
            <p className="font-bold" style={{ color: 'var(--text)' }}>{name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>📅 {weekStart}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: plan.is_active ? 'rgba(34,197,94,0.15)' : 'var(--surface-2)',
              color:      plan.is_active ? '#22C55E' : 'var(--text-muted)'
            }}
          >
            {plan.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>v{plan.version_number}</span>
        </div>
      </div>

      {/* Plan title */}
      <p className="font-bold text-base mb-4" style={{ color: 'var(--text)' }}>{plan.title}</p>

      {/* Progress bar */}
      {totalDays > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {completedDays}/{totalDays} days completed
              {skippedDays > 0 && ` • ${skippedDays} skipped`}
            </span>
            <span className="text-xs font-bold" style={{ color: pct === 100 ? '#22C55E' : pct > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
              {pct}%
            </span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'var(--surface-3)' }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width:      `${pct}%`,
                background: pct === 100 ? '#22C55E' : pct > 0 ? 'linear-gradient(90deg, #FF4500, #FF6B35)' : 'var(--surface-3)'
              }}
            />
          </div>
        </div>
      )}

      {/* Day dots */}
      {totalDays > 0 && (
        <div className="flex gap-1.5">
          {plan.plan_days.map(day => (
            <div
              key={day.id}
              className="h-1.5 flex-1 rounded-full"
              style={{
                background: day.status === 'completed' ? '#22C55E'
                          : day.status === 'skipped'   ? '#EF4444'
                          : day.status === 'in_progress' ? '#F59E0B'
                          : 'var(--surface-3)'
              }}
            />
          ))}
        </div>
      )}

      <p className="text-xs mt-4 text-right" style={{ color: 'var(--primary)' }}>
        View plan →
      </p>
    </button>
  )
}

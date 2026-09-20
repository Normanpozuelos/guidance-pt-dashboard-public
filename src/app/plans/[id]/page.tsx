'use client'

import { use, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { localeFor, useLanguage } from '@/lib/LanguageProvider'

interface WorkoutSetLog {
  id: string
  set_number: number
  actual_reps: number
  actual_weight: number
  completed: boolean
}

interface WorkoutLog {
  id: string
  plan_exercise_id: string
  logged_at: string
  workout_set_logs: WorkoutSetLog[]
}

interface PlanExercise {
  id: string
  exercise_name_snapshot: string
  exercise_name_no_snapshot: string | null
  planned_sets: number
  planned_reps_min: number
  planned_reps_max: number
  planned_weight: number
  rest_seconds: number
  notes: string | null
  order_index: number
  workout_logs: WorkoutLog[]
}

interface PlanDay {
  id: string
  name: string
  actual_day: string
  focus: string | null
  status: string
  day_order: number
  plan_exercises: PlanExercise[]
}

interface TrainingPlan {
  id: string
  title: string
  week_start: string
  is_active: boolean
  version_number: number
  notes: string | null
  client: { display_name: string | null } | null
  plan_days: PlanDay[]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params)
  const router  = useRouter()
  const { language } = useLanguage()
  const [plan, setPlan]           = useState<TrainingPlan | null>(null)
  const [loading, setLoading]     = useState(true)
  const [duplicating, setDuplicating] = useState(false)
  const [userId, setUserId]       = useState('')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      await fetchPlan()
    }
    init()
  }, [id])

  const fetchPlan = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('training_plans')
      .select(`
        id, title, week_start, is_active, version_number, notes,
        client:client_id (display_name),
        plan_days (
          id, name, actual_day, focus, status, day_order,
          plan_exercises (
            id, exercise_name_snapshot, exercise_name_no_snapshot,
            planned_sets, planned_reps_min, planned_reps_max,
            planned_weight, rest_seconds, notes, order_index,
            workout_logs (
              id, plan_exercise_id, logged_at,
              workout_set_logs (
                id, set_number, actual_reps, actual_weight, completed
              )
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (data) {
      const sorted = {
        ...data,
        plan_days: (data.plan_days as PlanDay[])
          .sort((a, b) => a.day_order - b.day_order)
          .map(day => ({
            ...day,
            plan_exercises: day.plan_exercises.sort((a, b) => a.order_index - b.order_index)
          }))
      }
      setPlan(sorted as unknown as TrainingPlan)
      // Expand completed days by default
      const completedIds = new Set(
        (sorted.plan_days as PlanDay[])
          .filter(d => d.status === 'completed' || d.status === 'skipped')
          .map(d => d.id)
      )
      setExpandedDays(completedIds)
    }
    setLoading(false)
  }

  const toggleDay = (id: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const duplicatePlan = async () => {
    if (!plan) return
    setDuplicating(true)
    try {
      const current  = new Date(plan.week_start)
      const nextWeek = new Date(current)
      nextWeek.setDate(current.getDate() + 7)
      const { data, error } = await supabase.rpc('duplicate_plan', {
        source_plan_id: plan.id,
        new_week_start: nextWeek.toISOString().split('T')[0],
        pt_user_id:     userId
      })
      if (error) throw error
      router.push(`/plans/${data}`)
    } catch (err) {
      console.error(err)
    } finally {
      setDuplicating(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!plan) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Plan not found</p>
        <button onClick={() => router.push('/plans')} style={{ color: 'var(--primary)' }}>← Back to plans</button>
      </div>
    </div>
  )

  const clientName    = plan.client?.display_name ?? 'No client'
  const weekStart     = new Date(plan.week_start).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'long', year: 'numeric' })
  const totalDays     = plan.plan_days.length
  const completedDays = plan.plan_days.filter(d => d.status === 'completed').length
  const skippedDays   = plan.plan_days.filter(d => d.status === 'skipped').length
  const pct           = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/plans')} className="text-sm font-medium transition-all hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
              ← Back
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>{plan.title}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                👤 {clientName} • v{plan.version_number}
              </p>
            </div>
          </div>
          
          <button
            onClick={duplicatePlan}
            disabled={duplicating}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {duplicating ? '...' : '📋 Duplicate week'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Plan overview card ────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl" style={{ background: 'var(--primary)' }}>
                {getInitials(clientName)}
              </div>
              <div>
                <p className="font-black text-xl" style={{ color: 'var(--text)' }}>{plan.title}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>📅 Week of {weekStart}</p>
              </div>
            </div>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{
                background: plan.is_active ? 'rgba(34,197,94,0.15)' : 'var(--surface-2)',
                color:      plan.is_active ? '#22C55E' : 'var(--text-muted)'
              }}
            >
              {plan.is_active ? '● Active' : 'Inactive'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {completedDays}/{totalDays} days completed
                {skippedDays > 0 && <span style={{ color: '#EF4444' }}> • {skippedDays} skipped</span>}
              </span>
              <span className="text-sm font-black" style={{ color: pct === 100 ? '#22C55E' : pct > 0 ? '#FF6B35' : 'var(--text-muted)' }}>
                {pct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--surface-3)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width:      `${pct}%`,
                  background: pct === 100 ? '#22C55E' : 'linear-gradient(90deg, #FF4500, #FF6B35)'
                }}
              />
            </div>
          </div>

          {/* Day dots */}
          <div className="flex gap-2">
            {plan.plan_days.map(day => (
              <div key={day.id} className="flex-1">
                <div
                  className="h-2 rounded-full mb-1"
                  style={{
                    background: day.status === 'completed'   ? '#22C55E'
                              : day.status === 'skipped'     ? '#EF4444'
                              : day.status === 'in_progress' ? '#F59E0B'
                              : 'var(--surface-3)'
                  }}
                />
                <p className="text-xs text-center capitalize" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  {day.actual_day.slice(0, 3)}
                </p>
              </div>
            ))}
          </div>

          {/* Notes */}
          {plan.notes && (
            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.2)' }}>
              <p className="text-sm" style={{ color: '#FF6B35' }}>📝 {plan.notes}</p>
            </div>
          )}
        </div>

        {/* ── Training days ─────────────────────────────────────────────────── */}
        {plan.plan_days.map(day => {
          const isExpanded = expandedDays.has(day.id)
          const totalSets     = day.plan_exercises.reduce((acc, ex) => acc + ex.planned_sets, 0)
          const completedSets = day.plan_exercises.reduce((acc, ex) => {
            const log = ex.workout_logs?.[0]
            if (!log) return acc
            return acc + (log.workout_set_logs?.filter(s => s.completed).length ?? 0)
          }, 0)
          const dayPct  = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
          const isFull  = completedSets === totalSets && totalSets > 0
          const isNone  = completedSets === 0 && day.status !== 'not_started'

          const statusLabel =
            day.status === 'skipped'     ? 'Skipped' :
            day.status === 'not_started' ? 'Not started' :
            isFull  ? 'Completed' :
            isNone  ? '0% logged' :
                      `${dayPct}% done`

          const statusColor =
            day.status === 'skipped'     ? '#EF4444' :
            day.status === 'not_started' ? 'var(--text-muted)' :
            isFull  ? '#22C55E' :
            isNone  ? '#EF4444' :
                      '#F59E0B'

          const statusBg =
            day.status === 'skipped'     ? 'rgba(239,68,68,0.15)' :
            day.status === 'not_started' ? 'var(--surface-3)' :
            isFull  ? 'rgba(34,197,94,0.15)' :
            isNone  ? 'rgba(239,68,68,0.15)' :
                      'rgba(245,158,11,0.15)'

          return (
            <div key={day.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>

              {/* Day header */}
              <button
                onClick={() => toggleDay(day.id)}
                className="w-full text-left px-6 py-4 flex items-center justify-between transition-all hover:opacity-90"
                style={{ background: 'var(--surface)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm"
                    style={{ background: day.status === 'completed' ? '#22C55E' : day.status === 'skipped' ? '#EF4444' : 'var(--primary)' }}
                  >
                    {day.status === 'completed' ? '✓' : day.status === 'skipped' ? '✕' : day.day_order}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text)' }}>{day.name}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                      {day.actual_day}{day.focus ? ` • ${day.focus}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: statusBg, color: statusColor }}
                  >
                    {statusLabel}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Exercises */}
              {isExpanded && (
                <div style={{ background: 'var(--surface-2)' }}>
                  {/* Table header */}
                  <div
                    className="grid grid-cols-4 gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                  >
                    <span>Exercise</span>
                    <span className="text-center">Planned</span>
                    <span className="text-center">Actual</span>
                    <span className="text-center">Status</span>
                  </div>

                  {day.plan_exercises.length === 0 ? (
                    <p className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No exercises added</p>
                  ) : (
                    day.plan_exercises.map((ex, i) => {
                      const log        = ex.workout_logs?.[0]
                      const logged     = !!log
                      const setLogs    = log?.workout_set_logs?.sort((a, b) => a.set_number - b.set_number) ?? []

                      return (
                        <div key={ex.id}>
                          {/* Exercise name row */}
                          <div
                            className="px-6 py-3"
                            style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                          >
                            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                              {i + 1}. {language === 'nb' && ex.exercise_name_no_snapshot
                                ? ex.exercise_name_no_snapshot
                                : ex.exercise_name_snapshot}
                            </p>
                            {ex.notes && (
                              <p className="text-xs mb-2" style={{ color: '#FF6B35' }}>💬 {ex.notes}</p>
                            )}

                            {/* Set rows */}
                            <div className="space-y-1">
                              {Array.from({ length: ex.planned_sets }).map((_, setIdx) => {
                                const actualSet  = setLogs.find(s => s.set_number === setIdx + 1)
                                const weightUp   = actualSet && actualSet.actual_weight > ex.planned_weight
                                const weightDown = actualSet && actualSet.actual_weight < ex.planned_weight
                                const repsOk     = actualSet && actualSet.actual_reps >= ex.planned_reps_min

                                return (
                                  <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                                    {/* Set label */}
                                    <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                                      Sett {setIdx + 1}
                                    </span>

                                    {/* Planned */}
                                    <div className="text-center">
                                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {ex.planned_reps_min}–{ex.planned_reps_max} reps
                                      </p>
                                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ex.planned_weight}kg</p>
                                    </div>

                                    {/* Actual */}
                                    <div className="text-center">
                                      {actualSet ? (
                                        <>
                                          <p className="text-xs font-bold" style={{
                                            color: !actualSet.completed ? '#EF4444' : repsOk ? '#22C55E' : '#F59E0B'
                                          }}>
                                            {actualSet.actual_reps} reps{!actualSet.completed ? ' ✗' : ''}
                                          </p>
                                          <p className="text-xs font-medium" style={{
                                            color: !actualSet.completed ? '#EF4444' : weightUp ? '#22C55E' : weightDown ? '#F59E0B' : 'var(--text-secondary)'
                                          }}>
                                            {actualSet.actual_weight}kg
                                            {actualSet.completed && weightUp && ' ↑'}
                                            {actualSet.completed && weightDown && ' ↓'}
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-xs font-medium" style={{ color: '#EF4444' }}>Not logged</p>
                                      )}
                                    </div>

                                    {/* Status icon */}
                                    <div className="text-center text-base">
                                      {actualSet
                                        ? actualSet.completed ? '✅' : '❌'
                                        : day.status !== 'not_started' ? '❌' : '—'
                                      }
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Rest time */}
                            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                              ⏱ {ex.rest_seconds}s rest
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}

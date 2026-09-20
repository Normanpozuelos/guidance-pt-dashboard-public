'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage, type Language } from '@/lib/LanguageProvider'
import { computeTrainingStats, normalizeExerciseKey, normalizeMuscleGroup, type CompletedSet, type TrainingStats } from '@/lib/trainingStats'

function localeFor(language: Language): string {
  return language === 'nb' ? 'nb-NO' : language === 'es' ? 'es-ES' : 'en-GB'
}

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
  exercise_id: string | null
  exercise_name_snapshot: string
  exercise_name_no_snapshot: string | null
  planned_sets: number
  planned_reps_min: number
  planned_reps_max: number
  planned_weight: number
  order_index: number
  notes: string | null
  exercises: { body_part: string | null } | null
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
  plan_days: PlanDay[]
}

interface ClientProfile {
  id: string
  display_name: string | null
}

interface PtClient {
  id: string
  status: string
  created_at: string
  client: ClientProfile | null
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const days  = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (weeks < 2) return `${days} days ago`
  return `${weeks} weeks ago`
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { language } = useLanguage()

  const [ptClient, setPtClient]     = useState<PtClient | null>(null)
  const [plans, setPlans]           = useState<TrainingPlan[]>([])
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading]       = useState(true)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      await fetchClientData(session.user.id)
    }
    init()
  }, [id])

  const fetchClientData = async (ptId: string) => {
    setLoading(true)
    try {
      const { data: clientData } = await supabase
        .from('pt_clients')
        .select('id, status, created_at, client:client_id(id, display_name)')
        .eq('id', id)
        .eq('pt_id', ptId)
        .single()

      setPtClient(clientData as unknown as PtClient)
      if (!clientData) return

      const clientUserId = (clientData as any).client?.id

      const { data: planData } = await supabase
        .from('training_plans')
        .select(`
          id, title, week_start, is_active, version_number, notes,
          plan_days (
            id, name, actual_day, focus, status, day_order,
            plan_exercises (
              id, exercise_id, exercise_name_snapshot, exercise_name_no_snapshot,
              planned_sets, planned_reps_min, planned_reps_max,
              planned_weight, order_index, notes,
              exercises ( body_part ),
              workout_logs (
                id, plan_exercise_id, logged_at,
                workout_set_logs (
                  id, set_number, actual_reps, actual_weight, completed
                )
              )
            )
          )
        `)
        .eq('client_id', clientUserId)
        .eq('pt_id', ptId)
        .order('week_start', { ascending: false })

      const typedPlans = (planData as unknown as TrainingPlan[]) ?? []
      setPlans(typedPlans)
      const active = typedPlans.find(p => p.is_active) ?? null
      setActivePlan(active)

      const completedSets: CompletedSet[] = []
      for (const plan of typedPlans) {
        for (const day of plan.plan_days) {
          for (const ex of day.plan_exercises) {
            for (const log of ex.workout_logs ?? []) {
              for (const set of log.workout_set_logs ?? []) {
                if (!set.completed) continue
                completedSets.push({
                  dateISO:         log.logged_at,
                  exerciseKey:     ex.exercise_id ?? normalizeExerciseKey(ex.exercise_name_snapshot),
                  exerciseName:    ex.exercise_name_snapshot,
                  exerciseNameNo:  ex.exercise_name_no_snapshot,
                  muscleGroup:     normalizeMuscleGroup(ex.exercises?.body_part ?? null),
                  weightKg:        set.actual_weight,
                })
              }
            }
          }
        }
      }
      setTrainingStats(computeTrainingStats(completedSets))

      // Auto-expand completed days
      if (active) {
        const ids = new Set(
          active.plan_days
            .filter(d => d.status === 'completed' || d.status === 'skipped')
            .map(d => d.id)
        )
        setExpandedDays(ids)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (id: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!ptClient) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Client not found</p>
        <button onClick={() => router.push('/clients')} style={{ color: 'var(--primary)' }}>← Back to clients</button>
      </div>
    </div>
  )

  const clientName    = (ptClient as any).client?.display_name ?? 'Unknown'
  const totalDays     = activePlan?.plan_days.length ?? 0
  const completedDays = activePlan?.plan_days.filter(d => d.status === 'completed').length ?? 0
  const skippedDays   = activePlan?.plan_days.filter(d => d.status === 'skipped').length ?? 0
  const pct           = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/clients')} className="text-sm font-medium transition-all hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
              ← Back
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white" style={{ background: 'var(--primary)' }}>
                {getInitials(clientName)}
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text)' }}>{clientName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {`Client since ${timeAgo(ptClient.created_at)}`}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/plans/new')}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
          >
            + New Plan
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── Active plan overview ──────────────────────────────────────────── */}
        {activePlan ? (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>Active Plan</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                {activePlan.title}
              </span>
            </div>

            {/* Progress overview */}
            <div className="rounded-2xl p-6 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold" style={{ color: 'var(--text)' }}>Weekly Progress</p>
                <p className="font-black text-2xl" style={{ color: pct === 100 ? '#22C55E' : pct > 0 ? '#FF6B35' : 'var(--text-muted)' }}>
                  {pct}%
                </p>
              </div>
              <div className="w-full h-2 rounded-full mb-3" style={{ background: 'var(--surface-3)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width:      `${pct}%`,
                    background: pct === 100 ? '#22C55E' : 'linear-gradient(90deg, #FF4500, #FF6B35)'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{completedDays}/{totalDays} days completed</span>
                {skippedDays > 0 && <span style={{ color: '#EF4444' }}>{skippedDays} skipped</span>}
                <span>{`📅 Week of ${new Date(activePlan.week_start).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'short' })}`}</span>
              </div>

              {/* Day dots */}
              <div className="flex gap-2 mt-4">
                {activePlan.plan_days.sort((a, b) => a.day_order - b.day_order).map(day => (
                  <div key={day.id} className="flex-1 text-center">
                    <div
                      className="h-2 rounded-full mb-1"
                      style={{
                        background: day.status === 'completed'   ? '#22C55E'
                                  : day.status === 'skipped'     ? '#EF4444'
                                  : day.status === 'in_progress' ? '#F59E0B'
                                  : 'var(--surface-3)'
                      }}
                    />
                    <p style={{ color: 'var(--text-muted)', fontSize: '10px' }} className="capitalize">
                      {day.actual_day.slice(0, 3)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Days with actual vs planned */}
            <div className="space-y-3">
              {activePlan.plan_days.sort((a, b) => a.day_order - b.day_order).map(day => {
                const isExpanded    = expandedDays.has(day.id)
                const totalSets     = day.plan_exercises.reduce((acc, ex) => acc + ex.planned_sets, 0)
                const completedSets = day.plan_exercises.reduce((acc, ex) => {
                  const log = ex.workout_logs?.[0]
                  if (!log) return acc
                  return acc + (log.workout_set_logs?.filter(s => s.completed).length ?? 0)
                }, 0)
                const dayPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
                const isFull = completedSets === totalSets && totalSets > 0

                const statusLabel =
                  day.status === 'skipped'     ? 'Skipped' :
                  day.status === 'not_started' ? 'Not started' :
                  isFull  ? 'Completed' :
                  dayPct > 0 ? `${dayPct}% done` : '0% logged'

                const statusColor =
                  day.status === 'skipped'     ? '#EF4444' :
                  day.status === 'not_started' ? 'var(--text-muted)' :
                  isFull  ? '#22C55E' :
                  dayPct > 0 ? '#F59E0B' : '#EF4444'

                const statusBg =
                  day.status === 'skipped'     ? 'rgba(239,68,68,0.15)' :
                  day.status === 'not_started' ? 'var(--surface-3)' :
                  isFull  ? 'rgba(34,197,94,0.15)' :
                  dayPct > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'

                return (
                  <div key={day.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleDay(day.id)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between transition-all hover:opacity-90"
                      style={{ background: 'var(--surface)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                          style={{ background: day.status === 'completed' ? '#22C55E' : day.status === 'skipped' ? '#EF4444' : 'var(--primary)' }}
                        >
                          {day.status === 'completed' ? '✓' : day.status === 'skipped' ? '✕' : day.day_order}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{day.name}</p>
                          <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                            {day.actual_day}{day.focus ? ` • ${day.focus}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: statusBg, color: statusColor }}>
                          {statusLabel}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {/* Exercises expanded */}
                    {isExpanded && (
                      <div style={{ background: 'var(--surface-2)' }}>
                        <div className="grid grid-cols-4 gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                          <span>Exercise</span>
                          <span className="text-center">Planned</span>
                          <span className="text-center">Actual</span>
                          <span className="text-center">Status</span>
                        </div>

                        {day.plan_exercises.sort((a, b) => a.order_index - b.order_index).map((ex, i) => {
                          const log     = ex.workout_logs?.[0]
                          const logged  = !!log
                          const setLogs = log?.workout_set_logs?.sort((a, b) => a.set_number - b.set_number) ?? []

                          return (
                            <div key={ex.id} className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                              <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>
                                {i + 1}. {language === 'nb' && ex.exercise_name_no_snapshot
                                  ? ex.exercise_name_no_snapshot
                                  : ex.exercise_name_snapshot}
                              </p>
                              {ex.notes && (
                                <p className="text-xs mb-2" style={{ color: '#FF6B35' }}>💬 {ex.notes}</p>
                              )}

                              <div className="space-y-1.5">
                                {Array.from({ length: ex.planned_sets }).map((_, setIdx) => {
                                  const actualSet  = setLogs.find(s => s.set_number === setIdx + 1)
                                  const weightUp   = actualSet && actualSet.actual_weight > ex.planned_weight
                                  const weightDown = actualSet && actualSet.actual_weight < ex.planned_weight
                                  const repsOk     = actualSet && actualSet.actual_reps >= ex.planned_reps_min

                                  return (
                                    <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                                      <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>Set {setIdx + 1}</span>
                                      <div className="text-center">
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ex.planned_reps_min}–{ex.planned_reps_max} reps</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ex.planned_weight}kg</p>
                                      </div>
                                      <div className="text-center">
                                        {actualSet ? (
                                          <>
                                            <p className="text-xs font-bold" style={{ color: !actualSet.completed ? '#EF4444' : repsOk ? '#22C55E' : '#F59E0B' }}>
                                              {actualSet.actual_reps} reps{!actualSet.completed ? ' ✗' : ''}
                                            </p>
                                            <p className="text-xs" style={{ color: !actualSet.completed ? '#EF4444' : weightUp ? '#22C55E' : weightDown ? '#F59E0B' : 'var(--text-secondary)' }}>
                                              {actualSet.actual_weight}kg{actualSet.completed && weightUp ? ' ↑' : actualSet.completed && weightDown ? ' ↓' : ''}
                                            </p>
                                          </>
                                        ) : (
                                          <p className="text-xs font-medium" style={{ color: '#EF4444' }}>Not logged</p>
                                        )}
                                      </div>
                                      <div className="text-center text-sm">
                                        {actualSet ? actualSet.completed ? '✅' : '❌' : day.status !== 'not_started' ? '❌' : '—'}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              📋
            </div>
            <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text)' }}>No active plan</h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Create a training plan for {clientName}</p>
            <button
              onClick={() => router.push('/plans/new')}
              className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              Create Plan
            </button>
          </div>
        )}

        {/* ── Progress ─────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-black mb-5" style={{ color: 'var(--text)' }}>Progress</h2>

          {!trainingStats?.hasHistory ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                📈
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text)' }}>No training history yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{clientName} hasn&apos;t logged any completed sets yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="font-black text-3xl mb-1" style={{ color: 'var(--primary)' }}>
                    {`${trainingStats.currentStreakDays} ${trainingStats.currentStreakDays === 1 ? 'day' : 'days'}`}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Current Streak</p>
                </div>
                <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="font-black text-3xl mb-1" style={{ color: 'var(--primary)' }}>
                    {`${trainingStats.longestStreakDays} ${trainingStats.longestStreakDays === 1 ? 'day' : 'days'}`}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Longest Streak</p>
                </div>
                <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="font-black text-3xl mb-1" style={{ color: 'var(--primary)' }}>
                    {trainingStats.weeklyConsistency
                      ? `${trainingStats.weeklyConsistency.activeWeeks} of ${trainingStats.weeklyConsistency.totalWeeks} weeks`
                      : '—'}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Weekly Consistency</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Biggest Improvement</p>
                  {trainingStats.biggestImprovement ? (
                    <>
                      <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                        {language === 'nb' && trainingStats.biggestImprovement.exerciseNameNo
                          ? trainingStats.biggestImprovement.exerciseNameNo
                          : trainingStats.biggestImprovement.exerciseName}
                      </p>
                      <p className="text-lg font-black" style={{ color: '#22C55E' }}>+{trainingStats.biggestImprovement.deltaKg} kg</p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not enough data yet</p>
                  )}
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Most Trained Muscle Group</p>
                  {trainingStats.mostTrainedMuscle ? (
                    <>
                      <p className="font-black text-lg capitalize" style={{ color: 'var(--text)' }}>{trainingStats.mostTrainedMuscle.muscleGroup}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{trainingStats.mostTrainedMuscle.count} sets logged</p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not enough data yet</p>
                  )}
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Best Training Week</p>
                  {trainingStats.bestWeek ? (
                    <>
                      <p className="font-black text-lg" style={{ color: 'var(--text)' }}>
                        {`Week of ${new Date(trainingStats.bestWeek.weekStart).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'short' })}`}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{trainingStats.bestWeek.sessionCount} sessions</p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not enough data yet</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Personal Records</p>
                {trainingStats.personalRecords.length > 0 ? (
                  <div>
                    {trainingStats.personalRecords.map((pr, i) => (
                      <div
                        key       = {`${pr.exerciseName}-${i}`}
                        className = "flex justify-between items-center py-2.5"
                        style     = {{ borderBottom: i < trainingStats.personalRecords.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {language === 'nb' && pr.exerciseNameNo ? pr.exerciseNameNo : pr.exerciseName}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{pr.maxWeightKg} kg</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(pr.achievedOn).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not enough data yet</p>
                )}
              </div>
            </>
          )}
        </section>

        {/* ── Previous plans ────────────────────────────────────────────────── */}
        {plans.filter(p => !p.is_active).length > 0 && (
          <section>
            <h2 className="text-lg font-black mb-4" style={{ color: 'var(--text-muted)' }}>Previous Plans</h2>
            <div className="space-y-2">
              {plans.filter(p => !p.is_active).map(plan => {
                const total     = plan.plan_days?.length ?? 0
                const completed = plan.plan_days?.filter(d => d.status === 'completed').length ?? 0
                const pct       = total > 0 ? Math.round((completed / total) * 100) : 0
                return (
                  <button
                    key={plan.id}
                    onClick={() => router.push(`/plans/${plan.id}`)}
                    className="w-full rounded-xl p-4 text-left transition-all hover:opacity-80 flex justify-between items-center"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: 0.6 }}
                  >
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{plan.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        📅 {new Date(plan.week_start).toLocaleDateString()} • v{plan.version_number} • {pct}% completed
                      </p>
                    </div>
                    <span style={{ color: 'var(--primary)', fontSize: '12px' }}>View →</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

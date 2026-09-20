'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { localeFor, useLanguage } from '@/lib/LanguageProvider'

interface Client {
  id: string
  client_id: string
  client: { id: string; display_name: string | null } | null
}

interface Exercise {
  id: string
  name: string
  name_no?: string | null
  body_part: string | null
}

interface PlanExercise {
  exercise_id:      string | null
  exercise_name:    string
  planned_sets:     number
  planned_reps_min: number
  planned_reps_max: number
  planned_weight:   number
  rest_seconds:     number
  notes:            string
}

interface PlanDay {
  name:       string
  focus:      string
  actual_day: string
  exercises:  PlanExercise[]
}

const DAYS_NO = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']
const DAYS_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const DAYS_EN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const STEPS = ['Client & Details', 'Training Days', 'Review & Save']

export default function NewPlanPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [userId, setUserId]       = useState('')
  const [clients, setClients]     = useState<Client[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [step, setStep]           = useState(0)

  // Plan details
  const [selectedClient, setSelectedClient] = useState('')
  const [title, setTitle]                   = useState('')
  const [weekStart, setWeekStart]           = useState('')
  const [notes, setNotes]                   = useState('')

  // Plan days
  const [days, setDays] = useState<PlanDay[]>([
    { name: 'Day 1', focus: '', actual_day: 'monday',    exercises: [] },
    { name: 'Day 2', focus: '', actual_day: 'wednesday', exercises: [] },
    { name: 'Day 3', focus: '', actual_day: 'friday',    exercises: [] },
  ])

  // Exercise picker
  const [showPicker, setShowPicker]     = useState(false)
  const [pickingForDay, setPickingForDay] = useState<number | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      const today = new Date()
      const day   = today.getDay()
      const diff  = day === 0 ? 1 : 8 - day
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + diff)
      setWeekStart(nextMonday.toISOString().split('T')[0])

      const { data: clientData } = await supabase
        .from('pt_clients')
        .select('id, client_id, client:client_id(id, display_name)')
        .eq('pt_id', session.user.id)
        .eq('status', 'active')
      setClients((clientData as unknown as Client[]) ?? [])

      const { data: exerciseData } = await supabase
        .from('exercises')
        .select('id, name, name_no, body_part')
        .eq('archived', false)
        .order('name')
      setExercises((exerciseData as unknown as Exercise[]) ?? [])
    }
    init()
  }, [router])

  const addDay = () => {
    setDays(prev => [...prev, { name: `Day ${prev.length + 1}`, focus: '', actual_day: 'monday', exercises: [] }])
  }

  const removeDay = (i: number) => setDays(prev => prev.filter((_, idx) => idx !== i))

  const updateDay = (i: number, field: keyof PlanDay, value: string) => {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }

  const addExercise = (dayIndex: number, exercise: Exercise) => {
    setDays(prev => prev.map((d, i) => i === dayIndex ? {
      ...d,
      exercises: [...d.exercises, {
        exercise_id: exercise.id, exercise_name: exercise.name_no || exercise.name,
        planned_sets: 3, planned_reps_min: 8, planned_reps_max: 12,
        planned_weight: 0, rest_seconds: 90, notes: ''
      }]
    } : d))
    setShowPicker(false)
    setPickingForDay(null)
    setExerciseSearch('')
  }

  const addCustomExercise = (dayIndex: number, name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    setDays(prev => prev.map((day, i) => i === dayIndex ? {
      ...day,
      exercises: [...day.exercises, {
        exercise_id: null,
        exercise_name: trimmedName,
        planned_sets: 3,
        planned_reps_min: 8,
        planned_reps_max: 12,
        planned_weight: 0,
        rest_seconds: 90,
        notes: '',
      }]
    } : day))
    setShowPicker(false)
    setPickingForDay(null)
    setExerciseSearch('')
  }

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d, exercises: d.exercises.filter((_, j) => j !== exIdx)
    } : d))
  }

  const updateExercise = (dayIdx: number, exIdx: number, field: keyof PlanExercise, value: string | number) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d, exercises: d.exercises.map((e, j) => j === exIdx ? { ...e, [field]: value } : e)
    } : d))
  }

  const savePlan = async () => {
    setSaving(true)
    setError('')
    try {
      const clientRecord = clients.find(c => c.id === selectedClient)
      const clientUserId = clientRecord?.client_id 

      await supabase.from('training_plans').update({ is_active: false })
        .eq('client_id', clientUserId).eq('pt_id', userId)

      const { data: plan, error: planError } = await supabase
        .from('training_plans')
        .insert({
          client_id: clientUserId, pt_id: userId, title,
          week_start: weekStart, is_active: true, version_number: 1,
          notes: notes || null, created_by: userId, last_modified_by: userId,
          last_modified_at: new Date().toISOString()
        })
        .select().single()
      if (planError) throw planError

      for (let i = 0; i < days.length; i++) {
        const day = days[i]
        const { data: planDay, error: dayError } = await supabase
          .from('plan_days')
          .insert({
            plan_id: plan.id,
            day_order: i + 1,
            actual_day: day.actual_day,
            name: language === 'nb' ? day.name.replace(/^Day (\d+)$/, 'Dag $1') : language === 'es' ? day.name.replace(/^Day (\d+)$/, 'Día $1') : day.name,
            focus: day.focus || null,
            status: 'not_started'
          })
          .select().single()
        if (dayError) throw dayError

        if (day.exercises.length > 0) {
          const { error: exError } = await supabase.from('plan_exercises').insert(
            day.exercises.map((ex, j) => ({
              plan_day_id: planDay.id, exercise_id: ex.exercise_id,
              exercise_name_snapshot: ex.exercise_name,
              exercise_name_no_snapshot: ex.exercise_name,
              order_index: j, planned_sets: ex.planned_sets,
              planned_reps_min: ex.planned_reps_min, planned_reps_max: ex.planned_reps_max,
              planned_weight: ex.planned_weight, rest_seconds: ex.rest_seconds,
              notes: ex.notes || null
            }))
          )
          if (exError) throw exError
        }
      }
      router.push('/plans')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const canGoNext = () => {
    if (step === 0) return selectedClient && title && weekStart
    if (step === 1) return days.length > 0
    return true
  }

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    (e.body_part ?? '').toLowerCase().includes(exerciseSearch.toLowerCase())
  )

  const selectedClientName = clients.find(c => c.id === selectedClient)
  const clientName = selectedClientName?.client?.display_name ?? ''

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => step === 0 ? router.push('/plans') : setStep(step - 1)}
              className="text-sm font-medium transition-all hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← {step === 0 ? 'Back' : 'Previous'}
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>
                G
              </div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>New Training Plan</h1>
            </div>
          </div>
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={savePlan}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              {saving ? 'Saving...' : 'Save Plan ✓'}
            </button>
          )}
        </div>
      </header>

      {/* ── Step indicator ────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                    style={{
                      background: i <= step ? 'var(--primary)' : 'var(--surface-3)',
                      color:      i <= step ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span
                    className="text-sm font-medium hidden sm:block"
                    style={{ color: i === step ? 'var(--text)' : 'var(--text-muted)' }}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2" style={{ background: i < step ? 'var(--primary)' : 'var(--border)', minWidth: '24px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {error && (
          <div className="p-4 rounded-xl mb-6 text-sm" style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid #FF4500', color: '#FF6B35' }}>
            {error}
          </div>
        )}

        {/* ── Step 1: Client & Details ───────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Client & Details</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Who is this plan for and when does it start?</p>
            </div>

            <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

              {/* Client */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Client *</label>
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.client?.display_name ?? 'Unknown client'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Plan Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Week 1 — Strength Foundation"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Week start */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Week Start Date *</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={e => setWeekStart(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Notes for client <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Instructions or focus for this week..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Training Days ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Training Days</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Add days and exercises for each session.</p>
              </div>
              <button
                onClick={addDay}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--surface-2)', color: 'var(--primary)', border: '1px solid var(--border)' }}
              >
                + Add Day
              </button>
            </div>

            <div className="space-y-4">
              {days.map((day, dayIndex) => (
                <div key={dayIndex} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>

                  {/* Day header */}
                  <div className="px-5 py-4 flex gap-3 items-center" style={{ background: 'var(--surface)' }}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    >
                      {dayIndex + 1}
                    </div>
                    <input
                      type="text"
                      value={day.name}
                      onChange={e => updateDay(dayIndex, 'name', e.target.value)}
                      placeholder="Day name"
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold outline-none"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                    <select
                      key={`${dayIndex}-${language}`}
                      data-no-translate
                      value={day.actual_day}
                      onChange={e => updateDay(dayIndex, 'actual_day', e.target.value)}
                      className="px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      {DAYS_EN.map((d, i) => (
                        <option key={d} value={d}>
                          {(language === 'nb' ? DAYS_NO[i] : language === 'es' ? DAYS_ES[i] : d).replace(/^./, letter => letter.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={day.focus}
                      onChange={e => updateDay(dayIndex, 'focus', e.target.value)}
                      placeholder="Focus (e.g. Chest)"
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                    {days.length > 1 && (
                      <button onClick={() => removeDay(dayIndex)} className="text-sm px-2 hover:opacity-70" style={{ color: '#EF4444' }}>✕</button>
                    )}
                  </div>

                  {/* Exercises */}
                  <div className="px-5 pb-4 pt-2 space-y-2" style={{ background: 'var(--surface-2)' }}>
                    {day.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="flex justify-between items-center mb-3 gap-3">
                          <input
                            type="text"
                            value={ex.exercise_name}
                            onChange={e => updateExercise(dayIndex, exIdx, 'exercise_name', e.target.value)}
                            placeholder="Exercise title"
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold outline-none"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                          />
                          <button onClick={() => removeExercise(dayIndex, exIdx)} className="text-xs hover:opacity-70" style={{ color: '#EF4444' }}>Remove</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {[
                            { label: 'Sets',     field: 'planned_sets',     value: ex.planned_sets },
                            { label: 'Reps min', field: 'planned_reps_min', value: ex.planned_reps_min },
                            { label: 'Reps max', field: 'planned_reps_max', value: ex.planned_reps_max },
                            { label: 'Weight kg',field: 'planned_weight',   value: ex.planned_weight },
                            { label: 'Rest sec', field: 'rest_seconds',     value: ex.rest_seconds },
                          ].map(({ label, field, value }) => (
                            <div key={field}>
                              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                              <input
                                type="number"
                                value={value}
                                onChange={e => updateExercise(dayIndex, exIdx, field as keyof PlanExercise, parseFloat(e.target.value))}
                                className="w-full px-2 py-1.5 rounded-lg text-sm outline-none text-center font-semibold"
                                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={ex.notes}
                            onChange={e => updateExercise(dayIndex, exIdx, 'notes', e.target.value)}
                            placeholder="PT note for client (optional)"
                            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => { setPickingForDay(dayIndex); setShowPicker(true) }}
                      className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 border-2 border-dashed"
                      style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                    >
                      + Add Exercise
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Save ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Review & Save</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Check everything looks good before saving.</p>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg" style={{ background: 'var(--primary)' }}>
                  {clientName.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-black text-lg" style={{ color: 'var(--text)' }}>{title}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    👤 {clientName} • 📅 {new Date(weekStart).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {notes && (
                <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid rgba(255,69,0,0.2)' }}>
                  <p className="text-sm" style={{ color: '#FF6B35' }}>📝 {notes}</p>
                </div>
              )}

              <div className="space-y-3">
                {days.map((day, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white" style={{ background: 'var(--surface-3)' }}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{day.name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                          {(language === 'nb' ? DAYS_NO[DAYS_EN.indexOf(day.actual_day)] : language === 'es' ? DAYS_ES[DAYS_EN.indexOf(day.actual_day)] : day.actual_day)}{day.focus ? ` • ${day.focus}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                      {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                ← Edit Days
              </button>
              <button
                onClick={savePlan}
                disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
              >
                {saving ? 'Saving...' : '🚀 Save Training Plan'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Exercise picker modal ─────────────────────────────────────────── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-2xl rounded-t-3xl flex flex-col" style={{ background: 'var(--surface)', maxHeight: '80vh' }}>
            <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Select Exercise</h3>
              <button onClick={() => { setShowPicker(false); setPickingForDay(null); setExerciseSearch('') }} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <input
                type="text"
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                placeholder="Search exercises..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => pickingForDay !== null && addExercise(pickingForDay, exercise)}
                  className="w-full text-left px-4 py-3 transition-all hover:opacity-80"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                    {language === 'nb' && exercise.name_no ? exercise.name_no : exercise.name}
                  </p>
                  {language === 'nb' && exercise.name_no && exercise.name_no !== exercise.name && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{exercise.name}</p>
                  )}
                  <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-muted)' }}>{exercise.body_part ?? ''}</p>
                </button>
              ))}
              {exerciseSearch.trim() && pickingForDay !== null && (
                <button
                  type="button"
                  onClick={() => addCustomExercise(pickingForDay, exerciseSearch)}
                  className="w-full text-left px-4 py-4 font-semibold transition-all hover:opacity-80"
                  style={{ color: 'var(--primary)', borderTop: '1px solid var(--border)' }}
                >
                  + Add “{exerciseSearch.trim()}” as a custom exercise
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Exercise {
  id: string
  name: string
  name_no?: string | null
  body_part: string | null
}

interface TemplateExercise {
  id?: string
  exercise_id:      string
  exercise_name:    string
  planned_sets:     number
  planned_reps_min: number
  planned_reps_max: number
  planned_weight:   number
  rest_seconds:     number
  notes:            string
  order_index:      number
}

interface TemplateDay {
  id?: string
  name:       string
  focus:      string
  day_order:  number
  exercises:  TemplateExercise[]
}

const CATEGORIES   = ['Strength', 'Cardio', 'Rehabilitation', 'Weight Loss', 'Hypertrophy', 'Flexibility']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export default function EditTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params)
  const router = useRouter()

  const [userId, setUserId]         = useState('')
  const [exercises, setExercises]   = useState<Exercise[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  // Template details
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]       = useState('')
  const [difficulty, setDifficulty]   = useState('')
  const [visibility, setVisibility]   = useState<'private' | 'public'>('private')

  // Template days
  const [days, setDays] = useState<TemplateDay[]>([])

  // Exercise picker
  const [showPicker, setShowPicker]         = useState(false)
  const [pickingForDay, setPickingForDay]   = useState<number | null>(null)
  const [search, setSearch]                 = useState('')

  // Drag & drop
  const [dragging, setDragging] = useState<{ dayIdx: number; exIdx: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ dayIdx: number; exIdx: number } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      // Fetch exercises
      const { data: exData } = await supabase
        .from('exercises')
        .select('id, name, name_no, body_part')
        .eq('archived', false)
        .order('name')
      setExercises((exData as unknown as Exercise[]) ?? [])

      // Fetch existing template
      const { data: tData } = await supabase
        .from('plan_templates')
        .select(`
          id, name, description, category, difficulty, visibility,
          template_days (
            id, name, focus, day_order,
            template_exercises (
              id, exercise_name_snapshot,
              planned_sets, planned_reps_min, planned_reps_max,
              planned_weight, rest_seconds, order_index, notes
            )
          )
        `)
        .eq('id', templateId)
        .single()

      if (tData) {
        setName(tData.name)
        setDescription(tData.description ?? '')
        setCategory(tData.category ?? '')
        setDifficulty(tData.difficulty ?? '')
        setVisibility(tData.visibility as 'private' | 'public')

        // Map to our day format
        const mappedDays = (tData.template_days as any[])
          .sort((a, b) => a.day_order - b.day_order)
          .map(day => ({
            id:        day.id,
            name:      day.name,
            focus:     day.focus ?? '',
            day_order: day.day_order,
            exercises: day.template_exercises
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((ex: any) => ({
                id:               ex.id,
                exercise_id:      ex.exercise_id ?? '',
                exercise_name:    ex.exercise_name_snapshot,
                planned_sets:     ex.planned_sets,
                planned_reps_min: ex.planned_reps_min,
                planned_reps_max: ex.planned_reps_max,
                planned_weight:   ex.planned_weight,
                rest_seconds:     ex.rest_seconds,
                notes:            ex.notes ?? '',
                order_index:      ex.order_index
              }))
          }))
        setDays(mappedDays)
      }
      setLoading(false)
    }
    init()
  }, [templateId])

  // ── Day management ────────────────────────────────────────────────────────
  const addDay = () => setDays(prev => [...prev, { name: `Day ${prev.length + 1}`, focus: '', day_order: prev.length + 1, exercises: [] }])
  const removeDay = (i: number) => setDays(prev => prev.filter((_, idx) => idx !== i))
  const updateDay = (i: number, field: keyof TemplateDay, value: string) =>
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))

  // ── Exercise management ───────────────────────────────────────────────────
  const addExercise = (dayIdx: number, exercise: Exercise) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d,
      exercises: [...d.exercises, {
        exercise_id: exercise.id, exercise_name: exercise.name_no || exercise.name,
        planned_sets: 3, planned_reps_min: 8, planned_reps_max: 12,
        planned_weight: 0, rest_seconds: 90, notes: '', order_index: d.exercises.length
      }]
    } : d))
    setShowPicker(false)
    setPickingForDay(null)
    setSearch('')
  }

  const removeExercise = (dayIdx: number, exIdx: number) =>
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d, exercises: d.exercises.filter((_, j) => j !== exIdx)
    } : d))

  const updateExercise = (dayIdx: number, exIdx: number, field: keyof TemplateExercise, value: string | number) =>
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d, exercises: d.exercises.map((e, j) => j === exIdx ? { ...e, [field]: value } : e)
    } : d))

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragStart = (dayIdx: number, exIdx: number) => setDragging({ dayIdx, exIdx })
  const handleDragOver  = (e: React.DragEvent, dayIdx: number, exIdx: number) => { e.preventDefault(); setDragOver({ dayIdx, exIdx }) }
  const handleDrop = (e: React.DragEvent, targetDayIdx: number, targetExIdx: number) => {
    e.preventDefault()
    if (!dragging) return
    setDays(prev => {
      const next = prev.map(d => ({ ...d, exercises: [...d.exercises] }))
      const [moved] = next[dragging.dayIdx].exercises.splice(dragging.exIdx, 1)
      next[targetDayIdx].exercises.splice(targetExIdx, 0, moved)
      return next
    })
    setDragging(null)
    setDragOver(null)
  }
  const handleDragEnd = () => { setDragging(null); setDragOver(null) }

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveTemplate = async () => {
    if (!name) { setError('Please add a template name.'); return }
    setSaving(true)
    setError('')
    try {
      // Update template details
      const { error: tError } = await supabase
        .from('plan_templates')
        .update({ name, description: description || null, category: category || null, difficulty: difficulty || null, visibility })
        .eq('id', templateId)
      if (tError) throw tError

      // Delete existing days and recreate
      await supabase.from('template_days').delete().eq('template_id', templateId)

      for (let i = 0; i < days.length; i++) {
        const day = days[i]
        const { data: tDay, error: dError } = await supabase
          .from('template_days')
          .insert({ template_id: templateId, day_order: i + 1, name: day.name, focus: day.focus || null })
          .select().single()
        if (dError) throw dError

        if (day.exercises.length > 0) {
          const { error: eError } = await supabase.from('template_exercises').insert(
            day.exercises.map((ex, j) => ({
              template_day_id:            tDay.id,
              exercise_id:                ex.exercise_id || null,
              exercise_name_snapshot:     ex.exercise_name,
              exercise_name_no_snapshot:  ex.exercise_name,
              order_index:                j,
              planned_sets:               ex.planned_sets,
              planned_reps_min:           ex.planned_reps_min,
              planned_reps_max:           ex.planned_reps_max,
              planned_weight:             ex.planned_weight,
              rest_seconds:               ex.rest_seconds,
              notes:                      ex.notes || null
            }))
          )
          if (eError) throw eError
        }
      }

      router.push(`/templates/${templateId}`)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.body_part ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/templates/${templateId}`)} className="text-sm font-medium hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
              ← Back
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>G</div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Edit Template</h1>
            </div>
          </div>
          <button
            onClick={saveTemplate}
            disabled={saving || !name}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
          >
            {saving ? 'Saving...' : 'Save Changes ✓'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid #FF4500', color: '#FF6B35' }}>
            {error}
          </div>
        )}

        {/* ── Template details ───────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-black text-lg" style={{ color: 'var(--text)' }}>Template Details</h2>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">Select...</option>
                {DIFFICULTIES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Visibility</label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {(['private', 'public'] as const).map(v => (
                  <button key={v} onClick={() => setVisibility(v)}
                    className="flex-1 py-3 text-sm font-semibold capitalize transition-all"
                    style={{ background: visibility === v ? 'var(--primary)' : 'var(--surface-2)', color: visibility === v ? '#fff' : 'var(--text-secondary)' }}
                  >
                    {v === 'private' ? '🔒' : '🌍'} {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Training days ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-lg" style={{ color: 'var(--text)' }}>Training Days</h2>
            <button onClick={addDay}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--surface-2)', color: 'var(--primary)', border: '1px solid var(--border)' }}
            >
              + Add Day
            </button>
          </div>

          {days.map((day, dayIdx) => (
            <div key={dayIdx} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="px-5 py-4 flex gap-3 items-center" style={{ background: 'var(--surface)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: 'var(--primary)' }}>
                  {dayIdx + 1}
                </div>
                <input type="text" value={day.name} onChange={e => updateDay(dayIdx, 'name', e.target.value)}
                  placeholder="Day name"
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <input type="text" value={day.focus} onChange={e => updateDay(dayIdx, 'focus', e.target.value)}
                  placeholder="Focus (e.g. Chest)"
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                {days.length > 1 && (
                  <button onClick={() => removeDay(dayIdx)} className="text-sm px-2" style={{ color: '#EF4444' }}>✕</button>
                )}
              </div>

              <div className="px-5 pb-4 pt-2 space-y-2" style={{ background: 'var(--surface-2)' }}>
                {day.exercises.length === 0 && (
                  <div className="py-6 text-center text-sm rounded-xl border-2 border-dashed"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, dayIdx, 0)}
                  >
                    Drop exercises here or click + Add Exercise
                  </div>
                )}

                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} draggable
                    onDragStart={() => handleDragStart(dayIdx, exIdx)}
                    onDragOver={e => handleDragOver(e, dayIdx, exIdx)}
                    onDrop={e => handleDrop(e, dayIdx, exIdx)}
                    onDragEnd={handleDragEnd}
                    className="rounded-xl p-4 transition-all"
                    style={{
                      background: dragOver?.dayIdx === dayIdx && dragOver?.exIdx === exIdx ? 'rgba(255,69,0,0.1)' : 'var(--surface)',
                      border: dragOver?.dayIdx === dayIdx && dragOver?.exIdx === exIdx ? '1px solid var(--primary)' : '1px solid var(--border)',
                      opacity: dragging?.dayIdx === dayIdx && dragging?.exIdx === exIdx ? 0.4 : 1,
                      cursor: 'grab'
                    }}
                  >
                    <div className="flex justify-between items-center mb-3 gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span style={{ color: 'var(--text-muted)', cursor: 'grab' }}>⠿⠿</span>
                        <input
                          type="text"
                          value={ex.exercise_name}
                          onChange={e => updateExercise(dayIdx, exIdx, 'exercise_name', e.target.value)}
                          placeholder="Exercise title"
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold outline-none"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                        />
                      </div>
                      <button onClick={() => removeExercise(dayIdx, exIdx)} className="text-xs" style={{ color: '#EF4444' }}>Remove</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        { label: 'Sets',      field: 'planned_sets',     value: ex.planned_sets },
                        { label: 'Reps min',  field: 'planned_reps_min', value: ex.planned_reps_min },
                        { label: 'Reps max',  field: 'planned_reps_max', value: ex.planned_reps_max },
                        { label: 'Weight kg', field: 'planned_weight',   value: ex.planned_weight },
                        { label: 'Rest sec',  field: 'rest_seconds',     value: ex.rest_seconds },
                      ].map(({ label, field, value }) => (
                        <div key={field}>
                          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                          <input type="number" value={value}
                            onChange={e => updateExercise(dayIdx, exIdx, field as keyof TemplateExercise, parseFloat(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg text-sm outline-none text-center font-semibold"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                          />
                        </div>
                      ))}
                    </div>
                    <input type="text" value={ex.notes}
                      onChange={e => updateExercise(dayIdx, exIdx, 'notes', e.target.value)}
                      placeholder="PT note (optional)"
                      className="w-full mt-2 px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                  </div>
                ))}

                <button
                  onClick={() => { setPickingForDay(dayIdx); setShowPicker(true) }}
                  className="w-full py-3 rounded-xl text-sm font-medium border-2 border-dashed transition-all hover:opacity-80"
                  style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                >
                  + Add Exercise
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={saveTemplate} disabled={saving || !name}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
        >
          {saving ? 'Saving...' : '✓ Save Changes'}
        </button>
      </main>

      {/* ── Exercise picker ───────────────────────────────────────────────── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-2xl rounded-t-3xl flex flex-col" style={{ background: 'var(--surface)', maxHeight: '80vh' }}>
            <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Select Exercise</h3>
              <button onClick={() => { setShowPicker(false); setPickingForDay(null); setSearch('') }} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search exercises..." autoFocus
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredExercises.map(exercise => (
                <button key={exercise.id}
                  onClick={() => pickingForDay !== null && addExercise(pickingForDay, exercise)}
                  className="w-full text-left px-4 py-3 transition-all hover:opacity-80"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{exercise.name}</p>
                  <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-muted)' }}>{exercise.body_part ?? ''}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
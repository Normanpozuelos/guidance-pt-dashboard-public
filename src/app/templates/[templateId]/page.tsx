'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface TemplateExercise {
  id: string
  exercise_name_snapshot: string
  planned_sets: number
  planned_reps_min: number
  planned_reps_max: number
  planned_weight: number
  rest_seconds: number
  order_index: number
  notes: string | null
}

interface TemplateDay {
  id: string
  name: string
  focus: string | null
  day_order: number
  template_exercises: TemplateExercise[]
}

interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  difficulty: string | null
  visibility: string
  created_at: string
  template_days: TemplateDay[]
}

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: 'rgba(34,197,94,0.15)',  color: '#22C55E' },
  intermediate: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  advanced:     { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444' },
}

export default function TemplateDetailPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params)
  const router = useRouter()

  const [template, setTemplate]       = useState<Template | null>(null)
  const [loading, setLoading]         = useState(true)
  const [duplicating, setDuplicating] = useState(false)
  const [userId, setUserId]           = useState('')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      await fetchTemplate()
    }
    init()
  }, [templateId])

  const fetchTemplate = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('plan_templates')
      .select(`
        id, name, description, category, difficulty, visibility, created_at,
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

    if (data) {
      const sorted = {
        ...data,
        template_days: (data.template_days as TemplateDay[])
          .sort((a, b) => a.day_order - b.day_order)
          .map(day => ({
            ...day,
            template_exercises: day.template_exercises.sort((a, b) => a.order_index - b.order_index)
          }))
      }
      setTemplate(sorted as unknown as Template)
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

  const duplicateTemplate = async () => {
    if (!template) return
    setDuplicating(true)
    try {
      // Create new template
      const { data: newTemplate, error: tError } = await supabase
        .from('plan_templates')
        .insert({
          pt_id:       userId,
          name:        `${template.name} (Copy)`,
          description: template.description,
          category:    template.category,
          difficulty:  template.difficulty,
          visibility:  'private'
        })
        .select().single()
      if (tError) throw tError

      // Copy days and exercises
      for (const day of template.template_days) {
        const { data: newDay, error: dError } = await supabase
          .from('template_days')
          .insert({
            template_id: newTemplate.id,
            day_order:   day.day_order,
            name:        day.name,
            focus:       day.focus
          })
          .select().single()
        if (dError) throw dError

        if (day.template_exercises.length > 0) {
          const { error: eError } = await supabase
            .from('template_exercises')
            .insert(
              day.template_exercises.map(ex => ({
                template_day_id:            newDay.id,
                exercise_name_snapshot:     ex.exercise_name_snapshot,
                exercise_name_no_snapshot:  ex.exercise_name_snapshot,
                order_index:                ex.order_index,
                planned_sets:               ex.planned_sets,
                planned_reps_min:           ex.planned_reps_min,
                planned_reps_max:           ex.planned_reps_max,
                planned_weight:             ex.planned_weight,
                rest_seconds:               ex.rest_seconds,
                notes:                      ex.notes
              }))
            )
          if (eError) throw eError
        }
      }

      router.push(`/templates/${newTemplate.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setDuplicating(false)
    }
  }

  const deleteTemplate = async () => {
    if (!confirm(`Delete "${template?.name}"? This cannot be undone.`)) return
    await supabase.from('plan_templates').delete().eq('id', templateId)
    router.push('/templates')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!template) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Template not found</p>
        <button onClick={() => router.push('/templates')} style={{ color: 'var(--primary)' }}>← Back to templates</button>
      </div>
    </div>
  )

  const diff      = DIFFICULTY_COLORS[template.difficulty ?? ''] ?? { bg: 'var(--surface-3)', color: 'var(--text-muted)' }
  const totalEx   = template.template_days.reduce((acc, d) => acc + d.template_exercises.length, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/templates')} className="text-sm font-medium hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
              ← Back
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>{template.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {template.category ?? 'No category'} • {template.template_days.length} days • {totalEx} exercises
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/templates/${templateId}/assign`)}
              className="px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              🚀 Assign
            </button>
            <button
              onClick={duplicateTemplate}
              disabled={duplicating}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {duplicating ? '...' : '📋 Duplicate'}
            </button>
            <button
              onClick={() => router.push(`/templates/${templateId}/edit`)}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={deleteTemplate}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
              style={{ background: 'var(--surface-2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              🗑
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Template overview ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>{template.name}</h1>
              {template.description && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {template.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
              {template.difficulty && (
                <span className="text-xs font-bold px-3 py-1 rounded-full capitalize" style={{ background: diff.bg, color: diff.color }}>
                  {template.difficulty}
                </span>
              )}
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: template.visibility === 'public' ? 'rgba(34,197,94,0.15)' : 'var(--surface-3)', color: template.visibility === 'public' ? '#22C55E' : 'var(--text-muted)' }}>
                {template.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>{template.template_days.length}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Training Days</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div>
              <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>{totalEx}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Exercises</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div>
              <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>
                {Math.round(totalEx / Math.max(template.template_days.length, 1))}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Exercises/Day</p>
            </div>
            {template.category && (
              <>
                <div style={{ width: '1px', background: 'var(--border)' }} />
                <div>
                  <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>📋</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{template.category}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Training days ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {template.template_days.map(day => {
            const isExpanded = expandedDays.has(day.id)
            return (
              <div key={day.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>

                {/* Day header */}
                <button
                  onClick={() => toggleDay(day.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between transition-all hover:opacity-90"
                  style={{ background: 'var(--surface)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    >
                      {day.day_order}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--text)' }}>{day.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {day.focus ? `${day.focus} • ` : ''}{day.template_exercises.length} exercises
                      </p>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* Exercises */}
                {isExpanded && (
                  <div style={{ background: 'var(--surface-2)' }}>
                    {/* Table header */}
                    <div
                      className="grid grid-cols-5 gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                    >
                      <span className="col-span-2">Exercise</span>
                      <span className="text-center">Sets × Reps</span>
                      <span className="text-center">Weight</span>
                      <span className="text-center">Rest</span>
                    </div>

                    {day.template_exercises.map((ex, i) => (
                      <div
                        key={ex.id}
                        className="grid grid-cols-5 gap-2 px-5 py-3 items-center"
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                        }}
                      >
                        {/* Name */}
                        <div className="col-span-2">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            {i + 1}. {ex.exercise_name_snapshot}
                          </p>
                          {ex.notes && (
                            <p className="text-xs mt-0.5" style={{ color: '#FF6B35' }}>💬 {ex.notes}</p>
                          )}
                        </div>

                        {/* Sets × Reps */}
                        <div className="text-center">
                          <p className="font-bold text-sm" style={{ color: 'var(--primary)' }}>
                            {ex.planned_sets} × {ex.planned_reps_min}-{ex.planned_reps_max}
                          </p>
                        </div>

                        {/* Weight */}
                        <div className="text-center">
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {ex.planned_weight > 0 ? `${ex.planned_weight}kg` : '—'}
                          </p>
                        </div>

                        {/* Rest */}
                        <div className="text-center">
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            ⏱ {ex.rest_seconds}s
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Bottom action bar ─────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/templates/${templateId}/assign`)}
            className="flex-1 py-4 rounded-2xl font-bold text-lg text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
          >
            🚀 Assign to Client
          </button>
          <button
            onClick={duplicateTemplate}
            disabled={duplicating}
            className="px-6 py-4 rounded-2xl font-bold text-lg transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {duplicating ? '...' : '📋'}
          </button>
          <button
            onClick={() => router.push(`/templates/${templateId}/edit`)}
            className="px-6 py-4 rounded-2xl font-bold text-lg transition-all hover:opacity-80"
            style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            ✏️
          </button>
        </div>
      </main>
    </div>
  )
}
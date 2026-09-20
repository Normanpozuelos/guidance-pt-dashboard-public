'use client'

import { useEffect, useRef, useState } from 'react'
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

const CATEGORY_ICONS: Record<string, string> = {
  Strength:       '💪',
  Cardio:         '🏃',
  Rehabilitation: '🩺',
  'Weight Loss':  '🔥',
  Hypertrophy:    '📈',
  Flexibility:    '🧘',
}

export default function TemplatesPage() {
  const router  = useRouter()
  const [templates, setTemplates]   = useState<Template[]>([])
  const [loading, setLoading]       = useState(true)
  const [userId, setUserId]         = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      await fetchTemplates(session.user.id)
    }
    init()
  }, [router])

  const fetchTemplates = async (ptId: string) => {
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
      .eq('pt_id', ptId)
      .order('created_at', { ascending: false })

    setTemplates((data as unknown as Template[]) ?? [])
    setLoading(false)
  }

  const deleteTemplate = async (id: string) => {
    await supabase.from('plan_templates').delete().eq('id', id)
    await fetchTemplates(userId)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-sm font-medium transition-all hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
              ← Back
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>G</div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Templates</h1>
            </div>
          </div>
          <button
            onClick={() => router.push('/templates/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
          >
            + New Template
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>

        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              📁
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>No templates yet</h2>
            <p className="mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Create reusable training templates and assign them to any client with one click.
            </p>
            <button
              onClick={() => router.push('/templates/new')}
              className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              Create First Template
            </button>
          </div>

        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {templates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                onDelete={() => deleteTemplate(template.id)}
                onAssign={() => router.push(`/templates/${template.id}/assign`)}
                onClick={() => router.push(`/templates/${template.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template, index, onDelete, onAssign, onClick
}: {
  template: Template
  index: number
  onDelete: () => void
  onAssign: () => void
  onClick: () => void
}) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const diff    = DIFFICULTY_COLORS[template.difficulty ?? ''] ?? { bg: 'var(--surface-3)', color: 'var(--text-muted)' }
  const icon    = CATEGORY_ICONS[template.category ?? ''] ?? '📋'
  const totalEx = template.template_days.reduce((acc, d) => acc + d.template_exercises.length, 0)

  // Gradient per index
  const gradients = [
    'linear-gradient(137deg, #FF3D77 0%, #FFB1CE 45%, #FF9D3C 100%)',
    'linear-gradient(137deg, #FFFFFF 0%, #7DD3FC 45%, #06B6D4 100%)',
    'linear-gradient(137deg, #4361EE 0%, #E0AEFF 45%, #F72585 100%)',
    'linear-gradient(137deg, #FF4500 0%, #22C55E 50%, #FF6B35 100%)',
  ]
  const gradient = gradients[index % gradients.length]

  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-[28px] opacity-40 pointer-events-none"
        style={{ background: gradient, filter: 'blur(40px)' }}
      />

      {/* Card */}
      <div
        className="relative rounded-[28px] overflow-hidden cursor-pointer transition-all hover:-translate-y-1"
        style={{
          background: `linear-gradient(#1A1A1C, #1A1A1C) padding-box, ${gradient} border-box`,
          border: '6px solid transparent',
        }}
        onClick={() => router.push(`/templates/${template.id}`)}
      >
        <div className="p-6">
          {/* Top row */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-black text-lg" style={{ color: 'var(--text)' }}>{template.name}</p>
                {template.category && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{template.category}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {template.difficulty && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: diff.bg, color: diff.color }}>
                  {template.difficulty}
                </span>
              )}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: template.visibility === 'public' ? 'rgba(34,197,94,0.15)' : 'var(--surface-3)', color: template.visibility === 'public' ? '#22C55E' : 'var(--text-muted)' }}>
                {template.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
              </span>
            </div>
          </div>

          {/* Description */}
          {template.description && (
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {template.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex gap-4 mb-5">
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>{template.template_days.length}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Days</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>{totalEx}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Exercises</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>
                {Math.round(totalEx / Math.max(template.template_days.length, 1))}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ex/Day</p>
            </div>
          </div>

          {/* Day pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {template.template_days
              .sort((a, b) => a.day_order - b.day_order)
              .map(day => (
                <span
                  key={day.id}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                >
                  {day.name}{day.focus ? ` · ${day.focus}` : ''}
                  <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                    ({day.template_exercises.length})
                  </span>
                </span>
              ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3" onClick={e => e.stopPropagation()}>
            <button
              onClick={onAssign}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
            >
              🚀 Assign to Client
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
              style={{ background: 'var(--surface-2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              🗑
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="font-black text-lg mb-2" style={{ color: 'var(--text)' }}>Delete template?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              "{template.name}" will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); onDelete() }}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: '#EF4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
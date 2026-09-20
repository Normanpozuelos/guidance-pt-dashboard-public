'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/LanguageProvider'

interface Client {
  id: string
  client: { id: string; display_name: string | null } | null
}

interface TemplateDay {
  id: string
  name: string
  focus: string | null
  day_order: number
  template_exercises: {
    id: string
    exercise_name_snapshot: string
    planned_sets: number
    planned_reps_min: number
    planned_reps_max: number
    planned_weight: number
    rest_seconds: number
    order_index: number
    notes: string | null
  }[]
}

interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  difficulty: string | null
  template_days: TemplateDay[]
}

const DAYS_NO = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAYS_EN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function AssignTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId: id } = use(params)
  const router  = useRouter()
  const { language } = useLanguage()

  const [template, setTemplate]     = useState<Template | null>(null)
  const [clients, setClients]       = useState<Client[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [userId, setUserId]         = useState('')

  // Assignment config
  const [selectedClient, setSelectedClient] = useState('')
  const [weekStart, setWeekStart]           = useState('')
  const [planTitle, setPlanTitle]           = useState('')
  const [dayMappings, setDayMappings]       = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      // Set default week start
      const today      = new Date()
      const day        = today.getDay()
      const diff       = day === 0 ? 1 : 8 - day
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + diff)
      setWeekStart(nextMonday.toISOString().split('T')[0])

      // Fetch template
      const { data: tData } = await supabase
        .from('plan_templates')
        .select(`
          id, name, description, category, difficulty,
          template_days (
            id, name, focus, day_order,
            template_exercises (
              id, exercise_name_snapshot,
              planned_sets, planned_reps_min, planned_reps_max,
              planned_weight, rest_seconds, order_index, notes
            )
          )
        `)
        .eq('id', id)
        .single()

      if (tData) {
        const sorted = {
          ...tData,
          template_days: (tData.template_days as TemplateDay[]).sort((a, b) => a.day_order - b.day_order)
        }
        setTemplate(sorted as unknown as Template)
        setPlanTitle(tData.name)
        // Default day mappings
        const defaults = ['monday', 'wednesday', 'friday', 'tuesday', 'thursday', 'saturday', 'sunday']
        setDayMappings((tData.template_days as TemplateDay[]).map((_, i) => defaults[i] ?? 'monday'))
      }

      // Fetch clients
      const { data: cData } = await supabase
        .from('pt_clients')
        .select('id, client:client_id(id, display_name)')
        .eq('pt_id', session.user.id)
        .eq('status', 'active')

      setClients((cData as unknown as Client[]) ?? [])
      setLoading(false)
    }
    init()
  }, [id])

  const updateDayMapping = (i: number, value: string) =>
    setDayMappings(prev => prev.map((d, idx) => idx === i ? value : d))

  const assignTemplate = async () => {
    if (!selectedClient || !planTitle || !weekStart) {
      setError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    setError('')

    try {
      const clientRecord = clients.find(c => c.id === selectedClient)
      const clientUserId = (clientRecord as any)?.client?.id ?? selectedClient

      // Deactivate old plans
      await supabase.from('training_plans').update({ is_active: false })
        .eq('client_id', clientUserId).eq('pt_id', userId)

      // Create plan from template
      const { data: plan, error: pError } = await supabase
        .from('training_plans')
        .insert({
          client_id:   clientUserId,
          pt_id:       userId,
          template_id: template!.id,
          title:       planTitle,
          week_start:  weekStart,
          is_active:   true,
          version_number: 1,
          created_by:  userId,
          last_modified_by: userId,
          last_modified_at: new Date().toISOString()
        })
        .select().single()
      if (pError) throw pError

      // Create plan days from template days
      for (let i = 0; i < template!.template_days.length; i++) {
        const tDay = template!.template_days[i]
        const { data: planDay, error: dError } = await supabase
          .from('plan_days')
          .insert({
            plan_id:    plan.id,
            day_order:  i + 1,
            actual_day: dayMappings[i] ?? 'monday',
            name:       tDay.name,
            focus:      tDay.focus,
            status:     'not_started'
          })
          .select().single()
        if (dError) throw dError

        if (tDay.template_exercises.length > 0) {
          const { error: eError } = await supabase.from('plan_exercises').insert(
            tDay.template_exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map((ex, j) => ({
                plan_day_id:               planDay.id,
                exercise_id:               null,
                exercise_name_snapshot:    ex.exercise_name_snapshot,
                exercise_name_no_snapshot: ex.exercise_name_snapshot,
                order_index:               j,
                planned_sets:              ex.planned_sets,
                planned_reps_min:          ex.planned_reps_min,
                planned_reps_max:          ex.planned_reps_max,
                planned_weight:            ex.planned_weight,
                rest_seconds:              ex.rest_seconds,
                notes:                     ex.notes
              }))
          )
          if (eError) throw eError
        }
      }

      router.push('/plans')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/templates')} className="text-sm font-medium hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>← Back</button>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>Assign Template</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{template?.name}</p>
            </div>
          </div>
          <button
            onClick={assignTemplate}
            disabled={saving || !selectedClient}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
          >
            {saving ? 'Assigning...' : '🚀 Assign to Client'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid #FF4500', color: '#FF6B35' }}>
            {error}
          </div>
        )}

        {/* Assignment config */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-black text-lg" style={{ color: 'var(--text)' }}>Assignment Details</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Client *</label>
              <select
                value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{(c as any).client?.display_name ?? 'Unknown'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Week Start *</label>
              <input
                type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Plan Title</label>
            <input
              type="text" value={planTitle} onChange={e => setPlanTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Day mapping */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-black text-lg mb-2" style={{ color: 'var(--text)' }}>Map Days to Weekdays</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Choose which day of the week each training day falls on for this client.
          </p>

          <div className="space-y-3">
            {template?.template_days.map((day, i) => (
              <div key={day.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: 'var(--primary)' }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{day.name}</p>
                  {day.focus && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{day.focus}</p>}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {day.template_exercises.length} exercises
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>→</span>
                  <select
                    key={`${i}-${language}`}
                    data-no-translate
                    value={dayMappings[i] ?? 'monday'}
                    onChange={e => updateDayMapping(i, e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    {DAYS_EN.map((d, idx) => (
                      <option key={d} value={d}>
                        {language === 'nb' ? DAYS_NO[idx] : language === 'es' ? DAYS_ES[idx] : d.replace(/^./, letter => letter.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assign button */}
        <button
          onClick={assignTemplate}
          disabled={saving || !selectedClient}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
        >
          {saving ? 'Assigning...' : '🚀 Assign Template to Client'}
        </button>
      </main>
    </div>
  )
}

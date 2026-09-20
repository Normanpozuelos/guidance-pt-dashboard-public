'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeProvider'
import { localeFor, useLanguage } from '@/lib/LanguageProvider'
import { computeTrainingStats, lbsToKg, normalizeExerciseKey, normalizeMuscleGroup, type CompletedSet, type TrainingStats } from '@/lib/trainingStats'

interface WorkoutSetRow {
  weight: number
  completed: boolean | null
}

interface WorkoutRow {
  id: string
  exercise_name: string
  date: string
  muscle_group: string | null
  weight_unit: string
  workout_sets: WorkoutSetRow[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language } = useLanguage()
  const [userEmail, setUserEmail]           = useState('')
  const [loading, setLoading]               = useState(true)
  const [clientCount, setClientCount]       = useState(0)
  const [planCount, setPlanCount]           = useState(0)
  const [templateCount, setTemplateCount]   = useState(0)
  const [trainingStats, setTrainingStats]   = useState<TrainingStats | null>(null)
  const bestWeekLabel = language === 'nb' ? 'Uke' : language === 'es' ? 'Semana del' : 'Week of'

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserEmail(session.user.email ?? '')

      const [
        { count: clients },
        { count: plans },
        { count: templates },
        { data: workoutRows }
      ] = await Promise.all([
        supabase.from('pt_clients').select('*', { count: 'exact', head: true }).eq('pt_id', session.user.id).eq('status', 'active'),
        supabase.from('training_plans').select('*', { count: 'exact', head: true }).eq('pt_id', session.user.id).eq('is_active', true),
        supabase.from('plan_templates').select('*', { count: 'exact', head: true }).eq('pt_id', session.user.id),
        supabase.from('workouts')
          .select('id, exercise_name, date, muscle_group, weight_unit, workout_sets(weight, completed)')
          .eq('user_id', session.user.id)
      ])

      setClientCount(clients ?? 0)
      setPlanCount(plans ?? 0)
      setTemplateCount(templates ?? 0)

      const completedSets: CompletedSet[] = []
      for (const row of ((workoutRows as unknown as WorkoutRow[]) ?? [])) {
        for (const set of row.workout_sets ?? []) {
          if (!set.completed) continue
          completedSets.push({
            dateISO:       row.date,
            exerciseKey:   normalizeExerciseKey(row.exercise_name),
            exerciseName:  row.exercise_name,
            muscleGroup:   normalizeMuscleGroup(row.muscle_group),
            weightKg:      row.weight_unit === 'lbs' ? lbsToKg(set.weight) : set.weight,
          })
        }
      }
      setTrainingStats(computeTrainingStats(completedSets))
      setLoading(false)
    }
    checkSession()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>
              G
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
              Guidance <span style={{ color: 'var(--primary)' }}>PT</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block" style={{ color: 'var(--text-secondary)' }}>{userEmail}</span>
            <button
              onClick={toggleTheme}
              className="text-lg px-3 py-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Welcome ──────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--text)' }}>
            Welcome back 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Here's what's happening with your clients today.
          </p>
        </div>

        {/* ── 3D Hero card ─────────────────────────────────────────────────── */}
        <HeroCard3D />

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard
            title    = "Total Clients"
            value    = {clientCount}
            icon     = "👤"
            href     = "/clients"
            gradient = "linear-gradient(137deg, #FF3D77 0%, #FFB1CE 45%, #FF9D3C 100%)"
            delay    = {0.1}
          />
          <StatCard
            title    = "Active Plans"
            value    = {planCount}
            icon     = "📋"
            href     = "/plans"
            gradient = "linear-gradient(137deg, #FFFFFF 0%, #7DD3FC 45%, #06B6D4 100%)"
            delay    = {0.2}
          />
          <StatCard
            title    = "Templates"
            value    = {templateCount}
            icon     = "📁"
            href     = "/templates"
            gradient = "linear-gradient(137deg, #4361EE 0%, #E0AEFF 45%, #F72585 100%)"
            delay    = {0.3}
          />
        </div>

        {/* ── My Training ──────────────────────────────────────────────────── */}
        <motion.div
          initial    = {{ opacity: 0, y: 20 }}
          animate    = {{ opacity: 1, y: 0 }}
          transition = {{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          className  = "mb-10"
        >
          <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>
            My Training
          </h2>

          {!trainingStats?.hasHistory ? (
            <div className="rounded-2xl flex flex-col items-center justify-center py-16 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                💪
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text)' }}>No training history yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Log a workout in the app to see your progress here.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <StatCard
                  title    = "Current Streak"
                  value    = {`${trainingStats.currentStreakDays} ${trainingStats.currentStreakDays === 1 ? 'day' : 'days'}`}
                  icon     = "🔥"
                  gradient = "linear-gradient(137deg, #FF4500 0%, #FFD23F 50%, #FF6B35 100%)"
                  delay    = {0.45}
                />
                <StatCard
                  title    = "Longest Streak"
                  value    = {`${trainingStats.longestStreakDays} ${trainingStats.longestStreakDays === 1 ? 'day' : 'days'}`}
                  icon     = "🏆"
                  gradient = "linear-gradient(137deg, #FF6B35 0%, #FFB199 45%, #FF4500 100%)"
                  delay    = {0.5}
                />
                <StatCard
                  title    = "Weekly Consistency"
                  value    = {trainingStats.weeklyConsistency
                    ? `${trainingStats.weeklyConsistency.activeWeeks} of ${trainingStats.weeklyConsistency.totalWeeks} weeks`
                    : '—'}
                  icon     = "📅"
                  gradient = "linear-gradient(137deg, #22C55E 0%, #86EFAC 45%, #16A34A 100%)"
                  delay    = {0.55}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Biggest Improvement</p>
                  {trainingStats.biggestImprovement ? (
                    <>
                      <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>{trainingStats.biggestImprovement.exerciseName}</p>
                      <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>+{trainingStats.biggestImprovement.deltaKg} kg</p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not enough data yet</p>
                  )}
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Most Trained Muscle Group</p>
                  {trainingStats.mostTrainedMuscle ? (
                    <>
                      <p className="font-bold text-lg capitalize" style={{ color: 'var(--text)' }}>{trainingStats.mostTrainedMuscle.muscleGroup}</p>
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
                      <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                        <span data-no-translate>{bestWeekLabel} {new Date(trainingStats.bestWeek.weekStart).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'short' })}</span>
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
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{pr.exerciseName}</span>
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
        </motion.div>

        {/* ── Quick actions ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ActionButton
              title       = "Add Client"
              description = "Generate an invite code"
              emoji       = "👤"
              onClick     = {() => router.push('/clients')}
            />
            <ActionButton
              title       = "Create Plan"
              description = "Build a training plan"
              emoji       = "📋"
              onClick     = {() => router.push('/plans/new')}
              primary
            />
            <ActionButton
              title       = "View Plans"
              description = "See all training plans"
              emoji       = "📊"
              onClick     = {() => router.push('/plans')}
            />
          </div>
        </div>

        {/* ── Nav links ────────────────────────────────────────────────────── */}
        <div className="mt-6 flex gap-3 flex-wrap">
          {[
            { label: 'Clients',       href: '/clients' },
            { label: 'Plans',         href: '/plans' },
            { label: 'New Plan',      href: '/plans/new' },
            { label: 'Templates',     href: '/templates' },
            { label: 'New Template',  href: '/templates/new' },
          ].map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

// ── 3D Hero card ─────────────────────────────────────────────────────────────────

function HeroCard3D() {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [transform, setTransform] = React.useState({ rotateX: 0, rotateY: 0, scale: 1 })
  const [glowPos, setGlowPos]     = React.useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect   = card.getBoundingClientRect()
    const x      = e.clientX - rect.left
    const y      = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -12
    const rotateY = ((x - centerX) / centerX) * 12
    setTransform({ rotateX, rotateY, scale: 1.02 })
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 })
  }

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 })
    setGlowPos({ x: 50, y: 50 })
  }

  const heroGradient = 'linear-gradient(137deg, #FF4500 0%, #22C55E 50%, #FF6B35 100%)'

  return (
    <div className="mb-10 relative" style={{ perspective: '1000px' }}>

      {/* Glow blob behind card */}
      <div
        className="absolute inset-0 rounded-[40px] opacity-50 pointer-events-none"
        style={{
          background: heroGradient,
          filter:     'blur(50px)',
          zIndex:     0
        }}
      />

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative cursor-pointer"
        style={{
          height:         '280px',
          borderRadius:   '32px',
          transform:      `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
          transition:     transform.scale === 1 ? 'transform 0.6s ease' : 'transform 0.1s ease',
          transformStyle: 'preserve-3d',
          background:     `linear-gradient(#0F0F0F, #0F0F0F) padding-box, ${heroGradient} border-box`,
          border:         '6px solid transparent',
          overflow:       'hidden',
          zIndex:         1,
        }}
      >
        {/* Image */}
        <img
          src="/coach-hero.png"
          alt="Coach with client"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 20%' }}
        />

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.4) 60%, rgba(255,69,0,0.2) 100%)' }}
        />

        {/* Mouse follow glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,69,0,0.15) 0%, transparent 60%)`,
            transition: 'background 0.1s ease'
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 p-8 flex flex-col justify-between" style={{ transform: 'translateZ(20px)' }}>
          <div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest"
              style={{ background: 'rgba(255,69,0,0.2)', color: '#FF6B35', border: '1px solid rgba(255,69,0,0.3)' }}
            >
              Guidance PT
            </span>
          </div>
          <div>
            <p className="text-white font-black text-3xl leading-tight mb-2">
              STRONGER TODAY.<br />
              <span style={{ color: '#FF6B35' }}>BETTER TOMORROW.</span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              The smartest way to manage your clients and deliver results.
            </p>
          </div>
        </div>

        {/* Shine effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)`,
          }}
        />
      </div>
    </div>
  )
}

// ── Glow stat card ───────────────────────────────────────────────────────────

function StatCard({
  title, value, icon, href, gradient, delay
}: {
  title:    string
  value:    number | string
  icon:     string
  href?:    string
  gradient: string
  delay:    number
}) {
  const router = useRouter()

  return (
    <motion.div
      initial    = {{ opacity: 0, y: 30 }}
      animate    = {{ opacity: 1, y: 0 }}
      transition = {{ duration: 0.8, ease: 'easeOut', delay }}
      onClick    = {() => href && router.push(href)}
      className  = {`relative flex flex-col items-start w-full ${href ? 'cursor-pointer' : ''}`}
    >
      {/* Glow background */}
      <div
        className = "absolute inset-0 rounded-[32px] opacity-60 pointer-events-none"
        style     = {{
          background: gradient,
          filter:     'blur(45px)',
        }}
      />

      {/* Foreground card with gradient border */}
      <div
        className = "relative w-full rounded-[32px] z-10 overflow-hidden p-6 flex flex-col justify-between"
        style     = {{
          minHeight:  '180px',
          background: `linear-gradient(#1A1A1C, #1A1A1C) padding-box, ${gradient} border-box`,
          border:     '8px solid transparent',
        }}
      >
        {/* Top row */}
        <div className="flex justify-between items-start">
          <span className="text-3xl">{icon}</span>
          {href && (
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              View →
            </span>
          )}
        </div>

        {/* Bottom — value + title */}
        <div>
          <p className={`font-black text-white mb-1 ${typeof value === 'string' ? 'text-3xl' : 'text-5xl'}`}>{value}</p>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{title}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Action button ─────────────────────────────────────────────────────────────

function ActionButton({
  title, description, emoji, onClick, primary
}: {
  title:       string
  description: string
  emoji:       string
  onClick:     () => void
  primary?:    boolean
}) {
  return (
    <button
      onClick   = {onClick}
      className = "flex items-start gap-4 p-4 rounded-xl text-left w-full transition-all hover:opacity-90 active:scale-95"
      style     = {{
        background: primary ? 'var(--primary)' : 'var(--surface-2)',
        border:     `1px solid ${primary ? 'var(--primary)' : 'var(--border)'}`,
        color:      primary ? '#fff' : 'var(--text)'
      }}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs mt-0.5" style={{ color: primary ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
          {description}
        </p>
      </div>
    </button>
  )
}

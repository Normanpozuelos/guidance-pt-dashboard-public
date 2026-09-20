// Pure calculation helpers for training progress stats.
// Consumed by /dashboard (freeform `workouts`/`workout_sets`) and
// /clients/[id] (structured `workout_logs`/`workout_set_logs`) — each page
// maps its own table shape into `CompletedSet[]` and calls `computeTrainingStats`.

export interface CompletedSet {
  dateISO: string
  exerciseKey: string
  exerciseName: string
  exerciseNameNo?: string | null
  muscleGroup: string | null
  weightKg: number
}

export interface TrainingStats {
  currentStreakDays: number
  longestStreakDays: number
  weeklyConsistency: { activeWeeks: number; totalWeeks: number } | null
  biggestImprovement: { exerciseName: string; exerciseNameNo?: string | null; deltaKg: number } | null
  mostTrainedMuscle: { muscleGroup: string; count: number } | null
  bestWeek: { weekStart: string; weekEnd: string; sessionCount: number } | null
  personalRecords: Array<{ exerciseName: string; exerciseNameNo?: string | null; maxWeightKg: number; achievedOn: string }>
  hasHistory: boolean
}

export function normalizeExerciseKey(name: string): string {
  return name.trim().toLowerCase()
}

// Freeform logging lets the mobile app store the muscle group in whatever
// language/spelling was active when it was logged (e.g. "Bein" in Norwegian).
// Normalize known variants to one canonical English key so the UI can then
// translate that single key consistently, regardless of how it was stored.
const MUSCLE_GROUP_SYNONYMS: Record<string, string> = {
  chest: 'chest', bryst: 'chest', pecho: 'chest', pectorales: 'chest',
  back: 'back', rygg: 'back', espalda: 'back',
  legs: 'legs', bein: 'legs', ben: 'legs', piernas: 'legs',
  core: 'core', kjerne: 'core', mage: 'core', núcleo: 'core', abdomen: 'core',
  shoulders: 'shoulders', skuldre: 'shoulders', hombros: 'shoulders',
  arms: 'arms', armer: 'arms', brazos: 'arms',
  glutes: 'glutes', setemuskler: 'glutes', rumpe: 'glutes', glúteos: 'glutes',
  cardio: 'cardio', kondisjon: 'cardio',
  full_body: 'full_body', fullbody: 'full_body', 'hele kroppen': 'full_body', 'cuerpo completo': 'full_body',
}

export function normalizeMuscleGroup(raw: string | null): string | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  if (!key) return null
  return MUSCLE_GROUP_SYNONYMS[key] ?? key
}

export function lbsToKg(weight: number): number {
  return weight * 0.453592
}

function toDateOnly(iso: string): Date {
  const d = new Date(iso)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function mondayOf(d: Date): Date {
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + diff)
  return monday
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setUTCDate(r.getUTCDate() + n)
  return r
}

export function computeTrainingStats(sets: CompletedSet[]): TrainingStats {
  if (sets.length === 0) {
    return {
      currentStreakDays: 0,
      longestStreakDays: 0,
      weeklyConsistency: null,
      biggestImprovement: null,
      mostTrainedMuscle: null,
      bestWeek: null,
      personalRecords: [],
      hasHistory: false,
    }
  }

  const dateSet = new Set<string>()
  for (const s of sets) dateSet.add(dateKey(toDateOnly(s.dateISO)))
  const sortedDates = Array.from(dateSet).sort()

  let longestStreakDays = 1
  let run = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const diffDays = Math.round(
      (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / 86400000
    )
    run = diffDays === 1 ? run + 1 : 1
    if (run > longestStreakDays) longestStreakDays = run
  }

  let currentStreakDays = 1
  for (let i = sortedDates.length - 1; i > 0; i--) {
    const diffDays = Math.round(
      (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / 86400000
    )
    if (diffDays === 1) currentStreakDays += 1
    else break
  }

  const weekSet = new Set<string>()
  const daysPerWeek = new Map<string, Set<string>>()
  for (const key of sortedDates) {
    const wk = dateKey(mondayOf(new Date(key)))
    weekSet.add(wk)
    if (!daysPerWeek.has(wk)) daysPerWeek.set(wk, new Set())
    daysPerWeek.get(wk)!.add(key)
  }
  const sortedWeeks = Array.from(weekSet).sort()
  const totalWeeks =
    Math.round(
      (new Date(sortedWeeks[sortedWeeks.length - 1]).getTime() - new Date(sortedWeeks[0]).getTime()) /
        (7 * 86400000)
    ) + 1
  const weeklyConsistency = { activeWeeks: sortedWeeks.length, totalWeeks }

  let bestWeek: TrainingStats['bestWeek'] = null
  for (const [wk, days] of daysPerWeek) {
    if (!bestWeek || days.size > bestWeek.sessionCount) {
      const start = new Date(wk)
      bestWeek = { weekStart: dateKey(start), weekEnd: dateKey(addDays(start, 6)), sessionCount: days.size }
    }
  }

  const muscleCounts = new Map<string, number>()
  for (const s of sets) {
    if (!s.muscleGroup) continue
    muscleCounts.set(s.muscleGroup, (muscleCounts.get(s.muscleGroup) ?? 0) + 1)
  }
  let mostTrainedMuscle: TrainingStats['mostTrainedMuscle'] = null
  for (const [muscleGroup, count] of muscleCounts) {
    if (!mostTrainedMuscle || count > mostTrainedMuscle.count) mostTrainedMuscle = { muscleGroup, count }
  }

  interface ExGroup { exerciseName: string; exerciseNameNo?: string | null; entries: CompletedSet[] }
  const byExercise = new Map<string, ExGroup>()
  for (const s of sets) {
    let g = byExercise.get(s.exerciseKey)
    if (!g) {
      g = { exerciseName: s.exerciseName, exerciseNameNo: s.exerciseNameNo, entries: [] }
      byExercise.set(s.exerciseKey, g)
    }
    g.entries.push(s)
  }

  let biggestImprovement: TrainingStats['biggestImprovement'] = null
  for (const g of byExercise.values()) {
    const sorted = [...g.entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    const uniqueDates = new Set(sorted.map(e => dateKey(toDateOnly(e.dateISO))))
    if (uniqueDates.size < 2) continue
    const delta = sorted[sorted.length - 1].weightKg - sorted[0].weightKg
    if (delta > 0 && (!biggestImprovement || delta > biggestImprovement.deltaKg)) {
      biggestImprovement = {
        exerciseName: g.exerciseName,
        exerciseNameNo: g.exerciseNameNo,
        deltaKg: Math.round(delta * 100) / 100,
      }
    }
  }

  const personalRecords: TrainingStats['personalRecords'] = []
  for (const g of byExercise.values()) {
    let maxWeight = -Infinity
    let achievedOn = ''
    for (const e of g.entries) {
      if (e.weightKg > maxWeight || (e.weightKg === maxWeight && e.dateISO > achievedOn)) {
        maxWeight = e.weightKg
        achievedOn = e.dateISO
      }
    }
    personalRecords.push({
      exerciseName: g.exerciseName,
      exerciseNameNo: g.exerciseNameNo,
      maxWeightKg: maxWeight,
      achievedOn,
    })
  }
  personalRecords.sort((a, b) => b.achievedOn.localeCompare(a.achievedOn))

  return {
    currentStreakDays,
    longestStreakDays,
    weeklyConsistency,
    biggestImprovement,
    mostTrainedMuscle,
    bestWeek,
    personalRecords,
    hasHistory: true,
  }
}

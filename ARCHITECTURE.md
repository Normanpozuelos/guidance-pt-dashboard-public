# ARCHITECTURE.md — Guidance PT Dashboard

Verified against the actual codebase on 2026-09-25. This document describes
what exists, not what's planned — see PRODUCT.md for intent/direction,
SECURITY.md for the authorization model, and DEVELOPMENT.md for how it
got here.

---

## Stack

- **Framework:** Next.js 16.2.6, App Router, React 19.2.4, TypeScript,
  Tailwind v4.
- **Package manager:** npm (`package-lock.json`).
- **Backend:** Supabase (Auth + PostgreSQL). No `supabase/` directory in
  this repo — no migrations, no RLS policy files, no local schema. The
  schema and RLS policies live entirely in the hosted Supabase project.
- **Deployment:** Vercel, zero-config (no `vercel.json`).
- **Dead dependencies:** `@supabase/auth-helpers-nextjs`, `resend`, and
  `@react-pdf/renderer` are in `package.json` but currently unused in
  `src/`. `@react-pdf/renderer` was introduced for a PDF export feature
  that was developed and then deferred. The planned capability is to
  generate printable or shareable training plans for PTs to use locally
  or provide to clients in a future version. See DEVELOPMENT.md for the
  development history.

---

## Request/auth flow

There is no middleware, no SSR session handling, and no cookie-based auth.
This is a fully client-rendered auth model:

1. `src/lib/supabase.ts` creates one browser Supabase client from
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Session
   lives in `localStorage` via supabase-js defaults.
2. Root `/` (`src/app/page.tsx`) is a bare `redirect('/login')`.
3. `src/app/login/page.tsx` handles both email/password
   (`signInWithPassword` / `signUp`) and Google OAuth
   (`signInWithOAuth({ provider: 'google', options: { redirectTo:
   \`${window.location.origin}/auth/callback\` } })`).
4. `src/app/auth/callback/page.tsx` is the OAuth landing page: it listens
   on `onAuthStateChange` and calls `getSession()`, redirecting to
   `/dashboard` or `/login`. supabase-js's default `detectSessionInUrl`
   does the actual token/code parsing — there is no server-side exchange
   route.
5. Every other protected page independently runs the same pattern in a
   `useEffect`:
   ```ts
   const { data: { session } } = await supabase.auth.getSession()
   if (!session) { router.push('/login'); return }
   ```
   This is client-side only — a direct visit to a protected URL briefly
   loads the page shell before redirecting. No page renders real data
   before its own `loading` state resolves, so this is a UX gate, not a
   security boundary; the actual security boundary is RLS (see
   `SECURITY.md`).
6. Logout (`supabase.auth.signOut()`) exists only on `/dashboard`.

Getting Google OAuth working also depends on configuration outside this
repo: the Google provider's client ID/secret and Site URL / Redirect URLs
in the Supabase Dashboard, and a matching authorized redirect URI in
Google Cloud Console.

---

## Data model — tables this dashboard actually uses

Confirmed via `.from(...)` calls across `src/`:

| Table | Used in | Purpose |
|---|---|---|
| `pt_clients` | clients, clients/[id], plans/new, dashboard, templates/assign | PT↔client relationship, invite lifecycle |
| `training_plans` | clients/[id], plans, plans/new, plans/[id], templates/assign, dashboard | One client's assigned plan for one week |
| `plan_days` | plans/new, templates/assign | Days within a training plan |
| `plan_exercises` | plans/new, templates/assign | Exercises within a plan day |
| `plan_templates` | dashboard, templates, templates/[id], templates/[id]/edit, templates/[id]/assign, templates/new | Reusable, client-independent plan structure |
| `template_days` | templates/new, templates/[id], templates/[id]/edit | Days within a template |
| `template_exercises` | templates/new, templates/[id], templates/[id]/edit | Exercises within a template day |
| `exercises` | plans/new, templates/new, templates/[id]/edit | Exercise library (`.eq('archived', false)`) |
| `workouts` | dashboard | PT's own freeform personal training log |
| `workout_sets` | dashboard (nested under `workouts`) | Sets for the PT's own freeform log |
| `workout_logs` | clients/[id], plans/[id] (nested) | Client's actual logged performance against a `plan_exercise` |
| `workout_set_logs` | clients/[id], plans/[id] (nested) | Sets for a client's logged performance |

No `profiles`, `client_metrics`, `progression_rules`, `media`,
`exercise_categories`, or `categories` table is referenced anywhere in this
repo. `auth.users.id` is used directly as `pt_id` / `client_id` — there is
no profiles table indirection.

Two server-side Postgres RPCs are called but not defined in this repo (they
live in the Supabase project, not as SQL files here):

- `generate_invite_code()` — `clients/page.tsx`, creates a client invite
  code.
- `duplicate_plan(source_plan_id, new_week_start, pt_user_id)` —
  `plans/[id]/page.tsx`, clones a plan one week forward.

### The two workout-logging paths (do not conflate)

- **`workouts` / `workout_sets`** — freeform, owned solely by the logged-in
  PT (`user_id = auth.uid()`), used only for the PT's own "My Training"
  section on `/dashboard`. This is the PT logging their *own* training,
  unrelated to any client.
- **`workout_logs` / `workout_set_logs`** — structured, nested three levels
  under `training_plans → plan_days → plan_exercises`, representing a
  *client's* actual performance against a specific planned exercise.
  Consumed on `/clients/[id]` and `/plans/[id]`.

`src/lib/trainingStats.ts` documents this split explicitly in its header
comment and normalizes both shapes into a common `CompletedSet[]` before
computing shared stats — but the two source tables are never merged or
cross-queried.

### Plans vs. templates

- `training_plans` always belongs to exactly one client (`client_id`,
  `pt_id`) for one week (`week_start`), with only one `is_active` plan per
  client at a time.
- `plan_templates` belongs to a PT only — no client attachment. It exists
  to be assigned to any client later.
- Assigning a template (`templates/[templateId]/assign/`) copies its
  `template_days`/`template_exercises` into new `plan_days`/
  `plan_exercises` rows under a new `training_plans` row, which keeps
  `template_id` set for lineage.
- `training_plans.template_id` is null for plans built from scratch
  (`plans/new/`).

### Public templates

`plan_templates.visibility` (`'private' | 'public'`) exists as a column
and a UI toggle (`templates/new/page.tsx`), and is displayed as a badge.
**No query in this codebase currently lists templates by visibility across
PTs** — the main list (`templates/page.tsx`) always filters
`.eq('pt_id', ptId)`. The only place cross-PT visibility could currently
surface is the three single-template-by-id queries
(`templates/[templateId]/page.tsx`, `.../edit/page.tsx`,
`.../assign/page.tsx`), which fetch `.eq('id', templateId)` with no
`pt_id` filter — whether that succeeds for another PT's template depends
entirely on RLS. There is no discovery/marketplace UI. Duplicating any
template (including a public one) always creates a new `visibility:
'private'` copy owned by the duplicating PT.

---

## PT/client ownership model

A PT only ever manages `pt_clients` rows — and their related plans,
templates, and client data — scoped to their own `auth.users.id`. A
client is invited (a `pt_clients` row with `status: 'pending'` and no
`client_id`), then redeems the invite code in the mobile app (outside
this repo), which sets `client_id` and flips status to `'active'`.
`'revoked'` is set by the PT; `'expired'` is read by the UI but never
written anywhere in this repo.

See `SECURITY.md` for how this ownership is enforced (application-layer
`pt_id` filters plus Supabase RLS), including the queries that rely on
RLS alone.

---

## Frontend structure

```
src/
├── app/
│   ├── api/plans/[planId]/{pdf,send}/
│   │                              — reserved for the deferred PDF/print
│   │                                and client-sharing capability
│   ├── auth/callback/page.tsx
│   ├── clients/page.tsx, [id]/page.tsx
│   ├── dashboard/page.tsx
│   ├── delete-account/page.tsx          ← static compliance page, no auth, no backend call
│   ├── login/page.tsx
│   ├── plans/page.tsx, new/page.tsx, [id]/page.tsx
│   ├── privacy/page.tsx
│   ├── templates/page.tsx, new/page.tsx, [templateId]/{page,edit,assign}.tsx
│   ├── layout.tsx, page.tsx (redirect('/login')), globals.css
├── lib/
│   ├── supabase.ts        — single browser Supabase client
│   ├── auth.ts            — getSession/getUser/signOut wrappers
│   ├── LanguageProvider.tsx — i18n (see below)
│   ├── ThemeProvider.tsx  — dark/light mode
│   └── trainingStats.ts   — shared stats calculation over both logging paths
```

There are currently no `api/` routes with implementation code. The
`plans/[planId]/pdf` and `plans/[planId]/send` directories are reserved
for a future PDF/print and client-sharing capability.

### Localization

Not a per-string `t('key')` catalog system in the conventional sense.
`LanguageProvider.tsx` holds two flat English→target dictionaries
(`norwegian`, `spanish`) and walks the live DOM with a `TreeWalker` +
`MutationObserver`, rewriting text nodes and
`placeholder`/`title`/`aria-label`/`alt` attributes in place whenever the
language changes. A `t(english)` function is also exposed via context for
imperative strings (e.g. `alert()`). Elements marked
`[data-no-translate]` are skipped (used for things like a raw weekday
`<select>`). Language is persisted to `localStorage` and auto-detected
from `navigator.language` on first load; a floating EN/NO/ES toggle is
rendered by the provider on every page.

### Theming

`ThemeProvider.tsx` is a small dark/light context, default `'dark'`,
persisted to `localStorage`, applied via `data-theme` on `<html>` (CSS
variables like `--bg`, `--surface` are used throughout).

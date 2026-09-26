# DEVELOPMENT.md — Guidance PT Dashboard

A record of how this dashboard evolved and why, based on the actual git
history (`git log`) and this session's own work. Dates below are commit
dates; anything not evidenced by a commit or a verified code change is
left out rather than guessed.

---

## Bootstrap and early UI (2026-05-23 – 2026-06-02)

The repo started as a stock `create-next-app` scaffold (2026-05-23), with
the real Guidance PT Dashboard app beginning the following week
(2026-05-31, "Initial commit — Guidance PT Dashboard"). The first week of
work (2026-06-01) was almost entirely UI: a full dark-theme redesign
across every page, a hero login page, card interaction fixes, and motion
effects. Templates as a first-class concept — separate from a one-off
training plan — landed immediately after (2026-06-01 "create templates to
plan", 2026-06-02 "Templates feature — view, edit, duplicate, assign"),
establishing the plan/template split described in ARCHITECTURE.md from
early on.

## PDF / print and client-sharing feature (2026-06-08)

On 2026-06-08, six commits in sequence show a PDF/export feature being
developed and then temporarily disabled while resolving the Vercel build.
The sequence included a privacy policy page, a PDF-export route for
training plans, fixes to the route implementation, an explicit
"Temporarily disable PDF routes - fix Vercel build" commit, and finally
"Remove PDF and email features temporarily" plus "Minimal route handlers
to fix build".

The feature was intentionally deferred rather than abandoned. The
`resend` and `@react-pdf/renderer` dependencies remain in `package.json`
but are currently unused in `src/`. The corresponding API route
directories are also currently empty.

The planned capability is to generate printable or shareable training
plans for personal trainers. A future version may allow PTs to generate
a PDF for local printing or share a training plan directly with a client.
Email delivery is also a possible future extension.

**Lesson:** temporarily disabling a feature can be the right way to
unblock a deployment, but deferred functionality should be documented
clearly so that unused dependencies and planned work are not forgotten.

## Stabilization and localization (2026-06-15 – 2026-06-25)

A client/training-save bug fix (2026-06-15), Norwegian/English translation
work (2026-06-23), and an account-deletion compliance page (2026-06-25,
required for app-store data-safety disclosures) followed. This is also
where `LanguageProvider`'s DOM-walking translation approach was already in
place — rather than a conventional per-string catalog, translation is done
by rewriting rendered DOM text against two flat English-keyed dictionaries
(Norwegian and Spanish), a design choice that predates this document.

## A ~2.5 month gap, then AI-assisted feature work (2026-09-04 – 2026-09-05)

After 2026-06-25 there's a roughly two-and-a-half month gap in commit
history before work resumed. The 2026-09-04 commit message — "Implement my
own training view and the costumer view with agents" — is the project's
own record that this phase of work (the PT's personal "My Training" view
on `/dashboard`, and the client detail view) was done with AI coding
agents, consistent with how this documentation itself was produced (see
below). Translation fixes and a bug fix for "best training week" followed
the next day (2026-09-05).

This is also where the two workout-logging paths described in
ARCHITECTURE.md became concretely visible in the code:
`workouts`/`workout_sets` for the PT's own freeform logging (My Training),
and `workout_logs`/`workout_set_logs` for a client's structured, plan-linked
performance (Client detail / Plan detail). `src/lib/trainingStats.ts`
documents this split explicitly in its own header comment — both feed a
shared stats calculation, but the underlying tables are deliberately kept
separate rather than merged, because they represent different things (a
PT training themselves vs. a PT observing a client).

## Google OAuth (2026-09-25)

Email/password was the only sign-in method until 2026-09-25, when Google
OAuth was added to `src/app/login/page.tsx` alongside it
(`signInWithOAuth({ provider: 'google' })`), with a new
`src/app/auth/callback/page.tsx` page to land the redirect and hand off to
the existing `onAuthStateChange`/`getSession()` session flow. No new
env vars were needed in this repo — the Google client ID/secret are
configured on the Supabase Dashboard's Auth provider settings, not in this
codebase. This work was done with Claude Code in an interactive session:
implementing the button and callback page, verifying the diff and running
`tsc`/`eslint` before committing, then separately auditing the existing
auth implementation (route protection, RLS reliance, authorization
consistency) once initial testing surfaced a Safari OAuth redirect error
caused by a Supabase/Google redirect-URL configuration mismatch (external
to this repo, not a code bug).

## RLS / ownership model

This repo has never contained Supabase migrations or RLS policy files —
the schema and RLS policies live entirely in the hosted Supabase project
and are configured out-of-band. As of this audit, the user has confirmed
that RLS correctly enforces PT ownership on `training_plans`,
`plan_templates`, and their child records. Several queries in the code
additionally scope by `pt_id` at the application layer as defense-in-depth
(`clients/page.tsx`, `plans/new/page.tsx`, `dashboard/page.tsx`), while a
few detail-page queries (`plans/[id]/page.tsx`,
`templates/[templateId]/page.tsx` and its `edit`/`assign` variants) fetch
by row `id` alone and rely on RLS entirely. This inconsistency exists in
the current code; it has not been corrected as part of this documentation
pass, since doing so is a code change requiring its own review.

## Template/public-sharing direction

`plan_templates.visibility` (`'private' | 'public'`) and its UI toggle
exist in the code (`templates/new/page.tsx`), but no query in the app
currently lists templates across PTs by visibility — the main template
list is always scoped to the current PT. This reads as intentional
scaffolding for a future cross-PT template-sharing or marketplace feature,
not a finished feature and not a bug — the column and UI exist ahead of
the discovery mechanism that would use them.

## AI-assisted development, honestly

Both the Google OAuth implementation and this project's documentation
(`PRODUCT.md`, `ARCHITECTURE.md`, `SECURITY.md`, `DEVELOPMENT.md`) were
produced with Claude Code, in an interactive session with the project
owner reviewing and approving each step (diff review, type-check, lint,
explicit approval before each commit). The 2026-09-04 commit message's
own "...with agents" phrasing indicates AI-assisted development predates
that session too, though the specifics of that earlier work aren't
independently documented beyond the commit message and the resulting
code.

This documentation was written by inspecting the actual repository
(`package.json`, full source tree, git history, and live grep of Supabase
table usage) rather than from assumption — where something couldn't be
verified from the code (for example, exactly how `pt_clients.status`
transitions to `'expired'`, which is read but never written anywhere in
this repo), that's noted as unverified rather than guessed at.

---

## Open items worth a real decision (not yet made)

- **PDF / print and client sharing:** implement the deferred capability
  to generate printable or shareable training plans for clients.
- **RLS-only queries:** decide whether `plans/[id]`, `templates/[id]`,
  and `templates/[id]/edit` should get an explicit `pt_id` filter to
  match the rest of the codebase, or whether relying on RLS there is
  accepted as sufficient.
- **Template sharing:** when/whether to build the discovery UI that would
  make `visibility: 'public'` actually visible to other PTs.

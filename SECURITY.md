# SECURITY.md — Guidance PT Dashboard

This document describes the authorization model actually implemented by
this project: what enforces access control, where, and a couple of known
asymmetries in how consistently that enforcement is applied at the
application layer. See `ARCHITECTURE.md` for the request/auth flow this
builds on.

---

## The real security boundary is Row Level Security

Authentication in this app is entirely client-side: a Supabase browser
client, session in `localStorage`, and a per-page `useEffect` that checks
`supabase.auth.getSession()` and redirects to `/login` if there isn't
one. That check is a **UX gate**, not a security boundary — it prevents
a logged-out user from seeing a page's shell, but it does nothing to stop
a request. **Supabase Row Level Security policies, configured on the
hosted Supabase project, are the actual access-control mechanism.** This
repository contains no `supabase/` directory, migrations, or policy
files — the schema and RLS policies live entirely in the hosted project
and aren't visible from the code alone.

---

## Ownership model

- There is no `profiles` table. `auth.users.id` is used directly as
  `pt_id`, and, for a client, as `pt_clients.client_id`.
- A PT only ever manages `pt_clients` rows (and their related plans,
  templates, and client data) scoped to their own `auth.users.id`.
- Every query is subject to Supabase RLS regardless of what the
  application layer adds — RLS is what actually enforces that a PT can
  only reach their own data. Most queries additionally add an explicit
  `.eq('pt_id', ...)` filter as a secondary, defense-in-depth check at
  the query layer. A few detail-page queries (single-record fetches by
  row `id` for an existing plan or template) skip that secondary filter
  and rely on RLS alone, which is still sufficient for access control on
  its own; this is noted here for consistency, not because those queries
  are unprotected.

---

## Two workout-logging paths, deliberately kept separate

The data model has two structurally similar but functionally distinct
logging paths, and they are never merged or cross-queried:

- **`workouts` / `workout_sets`** — a PT's own freeform personal
  training log, owned solely by that PT, used only for their own "My
  Training" view. This has nothing to do with any client.
- **`workout_logs` / `workout_set_logs`** — a **client's** structured,
  plan-linked logged performance against a specific assigned exercise,
  scoped to that client and visible to their PT.

`src/lib/trainingStats.ts` normalizes both shapes into a common
in-memory type for shared stats calculations, but the underlying tables
stay separate. Conflating them would mean a PT's own training data and a
client's training data sharing a table — a data-isolation boundary that's
treated as a hard rule, not a refactor target.

---

## Template visibility is not yet a cross-PT surface

`plan_templates.visibility` (`private` / `public`) exists as a column and
a UI toggle, but no query in this codebase currently lists templates
across PTs by visibility — the main template list always filters to the
current PT. Duplicating any template, including one marked public,
always produces a new private copy owned by the duplicating PT. See
`PRODUCT.md` for the product reasoning behind this column existing ahead
of any discovery feature that would use it.

---

## Google OAuth depends on configuration outside this repository

Sign-in supports both email/password and Google OAuth. Making Google
OAuth work end-to-end requires configuration that isn't in this
repository: the Google provider's client ID/secret and Site URL/redirect
URLs in the Supabase Dashboard, plus a matching authorized redirect URI
in Google Cloud Console.

---

## Environment variables and unused secrets

Only two environment variables are required to run this application —
see `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Both are public, client-side values by design (the `NEXT_PUBLIC_` prefix
is a Next.js convention for values safe to ship to the browser); the
anon key is meaningless for access control without RLS behind it.

Privileged credentials are kept outside the public repository and are
not required by the client-side application. A local development
environment may carry additional credentials left over from an earlier
PDF-export/email feature that was built and then reverted (see
`DEVELOPMENT.md`) — none of them are read by any code in this
repository. A privileged credential of that kind would bypass RLS
entirely, so it should never be exposed to the browser or committed.

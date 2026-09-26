# PRODUCT.md — Guidance PT Dashboard

## Why this project exists

Guidance PT Dashboard is the personal-trainer-facing side of the Guidance
project: a tool for PTs to run their coaching business without
administrative friction — managing clients, building training plans,
reusing templates, and seeing how clients are actually performing.

It shares its product philosophy with the Guidance iOS app (a separate
project, built on a different stack), adapted from an individual
trainee's workflow to a PT's:

- Technology exists to support the PT, not to demonstrate technical
  complexity.
- Every feature should make it easier for a PT to plan, assign, and track
  training for their clients — not add administrative overhead.
- The dashboard aims to reduce the PT's friction the same way the iOS app
  reduces a trainee's friction to start a workout.

See `ARCHITECTURE.md` for what this repository actually implements.

---

## Who uses this dashboard

- **PTs** sign in (email/password or Google) and manage their own roster
  of clients, templates, and training plans.
- **Clients** do not use this dashboard. They have their own separate
  accounts, redeemed via an invite code in a companion mobile app, and
  interact with their assigned plans there. This dashboard is the PT's
  side of the product only.

---

## PT → client workflow

1. A PT invites a client from the Clients page. This generates an invite
   code and creates a pending client record with a 7-day expiry.
2. The client redeems the invite code in the mobile app (outside this
   repository). Redemption links the invite to the client's own account
   and activates it.
3. Only active clients appear in plan/template assignment flows and
   dashboard counts. A PT can revoke an invite; an "expired" state is
   read by the UI but set by a process outside this repository.
4. Once active, the PT can view the client's detail page, which shows
   their assigned plans and logged performance.

---

## Training plans and templates

- A **training plan** is assigned to one specific client for one week,
  with only one active plan per client at a time — creating a new plan
  deactivates the client's previous one.
- A **template** is a reusable plan structure with no client attached,
  built once by a PT and assignable to any of their clients later.
- Assigning a template to a client copies its structure into a new
  training plan, which keeps a reference back to the template it came
  from, so a plan's origin stays traceable.
- Plans can also be built from scratch, or duplicated forward one week.
- Duplicating a template always produces a new **private** copy owned by
  the duplicating PT — this is intentionally the mechanism for a PT to
  "adopt" a template as their own starting point.

---

## Template visibility: a forward-looking design decision

Templates carry a `private` / `public` visibility flag and a UI toggle
for it. This is intentional scaffolding rather than a finished feature:
templates are meant to eventually be shareable or discoverable across
PTs, and this flag — together with Supabase Row Level Security — is the
foundation for that.

No discovery or "browse public templates" UI exists yet. The current
template list is always scoped to the owning PT, so today this flag has
no user-facing effect beyond a badge shown on the owner's own template.
It's documented here so the design intent behind an otherwise-unused
column is clear, rather than reading as dead code.

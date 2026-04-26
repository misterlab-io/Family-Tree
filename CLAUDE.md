# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mobile-first family tree web app. Users register/login, input family members, and view their genealogy as an interactive visual graph. MVP deployed to Vercel; architecture is designed for future React Native migration.

Full architecture details: `docs/ARCHITECTURE.md`

---

## Commands

```bash
# Development
npm run dev

# Type checking
npm run type-check   # or: npx tsc --noEmit

# Linting
npm run lint

# Build
npm run build

# Database migrations (run in Supabase SQL editor, not CLI)
# File: supabase/migrations/0001_initial.sql
```

---

## Architecture

**Stack**: Next.js 15 (App Router) + TypeScript + Supabase + React Flow + TanStack Query + shadcn/ui + Tailwind v4

### Key Abstraction: Tree Layout Pipeline

`lib/tree/layout.ts` is the architectural centerpiece — it transforms raw DB rows into React Flow nodes/edges:

```
persons[] + relationships[] → couple nodes inserted → Dagre layout → React Flow nodes+edges
```

The "couple node" pattern inserts a small invisible node between spouses; parent-child edges originate from this node so children render cleanly below both parents.

### Two Supabase Client Patterns

- `lib/supabase/client.ts` — `createBrowserClient`, singleton, used in Client Components
- `lib/supabase/server.ts` — `createServerClient`, async factory, used in Server Components/Actions (requires `next/headers`)

Never mix them up — using the server client in a Client Component will throw at runtime.

### Route Protection

`middleware.ts` (root) handles two things: Supabase token refresh on every request (required — sessions expire silently without it), and redirects (unauthenticated → `/login`, authenticated on auth pages → `/tree`).

### State Management

Remote data (`persons[]`, `relationships[]`) lives in TanStack Query, not Zustand/Context. Local UI state (modal open, selected node) uses `useState`. Don't duplicate server state into client stores.

### Relationship Canonical Ordering

Symmetric relationship types (`spouse`, `ex_spouse`, `sibling`) enforce `person_a_id < person_b_id` via a DB partial unique index using `LEAST`/`GREATEST`. The `lib/db/relationships.ts` create function must apply this ordering before inserting, or the insert will violate the constraint.

### App Router Groups

- `(auth)/` — unauthenticated shell (login, register)
- `(app)/` — authenticated shell with bottom nav; layout performs server-side session check

---

## Conventions

- **DB queries** live in `lib/db/` — never inline Supabase calls in components or pages.
- **Hooks** in `hooks/` wrap React Query and expose typed data + mutation functions.
- **Forms** use `react-hook-form` + `zod` schemas. Zod schema is the single source of truth for field validation — don't duplicate rules in the DB layer.
- **Mobile-first**: minimum 44px tap targets on all interactive elements. `MiniMap` in the tree view is hidden below `md:` breakpoint. Navigation uses `BottomNav` on mobile, sidebar on `md:+`.
- **Edge colors**: spouse = solid blue, ex_spouse = dashed gray, parent_child = solid black, sibling = solid light blue.
- **Dialog z-index**: Dialog uses `z-[60]`, above BottomNav (`z-50`). Keep this ordering for any new overlay components.
- **Next.js Image**: External image domains must be whitelisted in `next.config.ts` → `images.remotePatterns`. Supabase Storage (`*.supabase.co`) is already configured.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Set in `.env.local` for local dev, and in Vercel project settings for production.

---

## Build Status

All 5 phases complete. MVP is deployed to Vercel.

| Phase | Status | Summary |
|---|---|---|
| 1 — Scaffold + Auth | ✅ | Next.js 15, Supabase auth, middleware, login/register |
| 2 — Person CRUD | ✅ | lib/db/persons, hooks, PersonForm + photo upload, members pages |
| 3 — Relationships | ✅ | lib/db/relationships (LEAST/GREATEST), RelationshipForm, detail page |
| 4 — Tree Visualization | ✅ | layout.ts (couple-node + Dagre), PersonNode, RelationshipEdge, FamilyTreeCanvas |
| 5 — Polish + Deploy | ✅ | loading.tsx + error.tsx per route, deployed to Vercel |

## Supabase Storage

Bucket `person-photos` must exist with the following policies (run in SQL Editor or set via Dashboard):

```sql
-- Upload: authenticated users can only write to their own folder
CREATE POLICY "owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'person-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete: authenticated users can only delete from their own folder
CREATE POLICY "owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'person-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

# Progress & Handoff Notes

## Status: Phase 1 DONE — siap lanjut Phase 2

---

## Yang sudah selesai

### Phase 1 — Scaffold + Auth ✅
Commit: `9cf0d31` di branch `claude/add-claude-documentation-7gfdK`

**File-file yang sudah dibuat:**
- `app/(auth)/login/page.tsx` — form login dengan react-hook-form + zod, bahasa Indonesia
- `app/(auth)/register/page.tsx` — form register + success state (cek email)
- `app/(auth)/layout.tsx` — shell centered, tanpa nav
- `app/(app)/layout.tsx` — server-side session check, redirect ke `/login` kalau tidak auth
- `app/(app)/tree/page.tsx` — placeholder halaman utama (greet user by name)
- `app/(app)/members/page.tsx` — placeholder
- `app/(app)/settings/page.tsx` — placeholder + tombol logout
- `app/page.tsx` — redirect ke `/tree`
- `app/layout.tsx` — root layout, font Geist, metadata "Family Tree"
- `app/globals.css` — Tailwind v4 + CSS custom properties (design tokens)
- `middleware.ts` — Supabase token refresh + route guard
- `lib/supabase/client.ts` — `createBrowserClient` (Client Components)
- `lib/supabase/server.ts` — `createServerClient` async factory (Server Components)
- `lib/utils.ts` — fungsi `cn()` (clsx + tailwind-merge)
- `components/ui/button.tsx` — Button component (variant: default/outline/ghost/destructive)
- `components/ui/input.tsx` — Input component dengan label + error state
- `components/layout/BottomNav.tsx` — navigasi bawah mobile, 44px tap targets
- `components.json` — shadcn/ui config (manual, registry tidak accessible dari environment ini)
- `supabase/migrations/0001_initial.sql` — schema lengkap: profiles, persons, relationships, RLS, trigger auto-create profile, unique index relasi simetris
- `.env.local.example`

**Dependencies yang sudah ter-install:**
```
@supabase/ssr, @supabase/supabase-js
@xyflow/react, @dagrejs/dagre
@tanstack/react-query
react-hook-form, zod, @hookform/resolvers
date-fns, lucide-react, clsx, tailwind-merge
```

---

## Apa yang perlu dilakukan user (setup manual)

1. Isi `.env.local` (buat file ini, jangan commit):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://oquxdreczzvxpxrcxjde.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Jalankan `supabase/migrations/0001_initial.sql` di Supabase SQL Editor (website supabase.com)
3. `npm install && npm run dev`

---

## Phase 2 — Yang harus dikerjakan selanjutnya

### Tujuan: User bisa tambah, lihat, edit, hapus anggota keluarga dengan foto

**Langkah-langkah:**

1. **`lib/types.ts`** — definisi TypeScript types: `Person`, `Relationship`, `RelationshipType`

2. **`lib/db/persons.ts`** — query functions:
   - `getPersons(userId)` — fetch semua persons milik user
   - `createPerson(data)` — insert person baru
   - `updatePerson(id, data)` — update person
   - `deletePerson(id)` — delete person

3. **`lib/db/relationships.ts`** — query functions (dengan canonical ordering):
   - `getRelationships(userId)`
   - `createRelationship(data)` — harus apply LEAST/GREATEST sebelum insert untuk symmetric types
   - `deleteRelationship(id)`

4. **Setup TanStack Query** — `ReactQueryProvider` di `app/layout.tsx`

5. **`hooks/usePersons.ts`** — React Query hook: fetch persons + mutations

6. **`components/members/PersonForm.tsx`** — form tambah/edit person:
   - Fields: full_name, gender, birth_date, death_date, birth_place, bio, is_living, photo
   - Validasi dengan zod
   - Upload foto ke Supabase Storage bucket `person-photos`

7. **`components/members/PersonCard.tsx`** — card untuk list view

8. **Wire halaman:**
   - `app/(app)/members/page.tsx` — list semua persons
   - `app/(app)/members/new/page.tsx` — form tambah
   - `app/(app)/members/[id]/page.tsx` — detail person
   - `app/(app)/members/[id]/edit/page.tsx` — form edit

9. **Supabase Storage** — buat bucket `person-photos` di Supabase dashboard dengan RLS policy (owner-only). SQL-nya ada di komentar `0001_initial.sql` bagian paling bawah.

### Done when:
User bisa tambah person → muncul di list → edit → hapus → foto terupload dan tampil.

---

## Catatan arsitektur penting untuk Phase 2+

- **Jangan** inline Supabase calls di components — semua query lewat `lib/db/`
- **Jangan** pakai Zustand/Context untuk data remote — pakai TanStack Query
- Untuk symmetric relationships (`spouse`, `ex_spouse`, `sibling`), function `createRelationship` wajib apply:
  ```ts
  person_a_id: a < b ? a : b,
  person_b_id: a < b ? b : a,
  ```
- shadcn registry tidak accessible dari dev environment ini — tambah UI components secara manual di `components/ui/`
- `createBrowserClient` di `lib/supabase/client.ts` tidak perlu singleton pattern — Supabase SSR sudah handle deduplication

---

## Referensi file kritis

| File | Fungsi |
|---|---|
| `middleware.ts` | Token refresh + route guard — jangan diubah tanpa hati-hati |
| `supabase/migrations/0001_initial.sql` | Schema lengkap + RLS |
| `lib/supabase/server.ts` | Dipakai di semua Server Components & Actions |
| `lib/supabase/client.ts` | Dipakai di semua Client Components |
| `docs/ARCHITECTURE.md` | Rencana arsitektur lengkap semua phase |

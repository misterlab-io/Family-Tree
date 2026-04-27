# Progress & Handoff Notes

## Status: Phase 5 DONE — MVP live di Vercel. Lanjut Phase 6: Search & Filter

---

## Ringkasan Phase yang Sudah Selesai

| Phase | Status | Commit |
|---|---|---|
| 1 — Scaffold + Auth | ✅ | `9cf0d31` |
| 2 — Person CRUD | ✅ | `0d25371` |
| 3 — Relationships | ✅ | `4875d88` |
| 4 — Tree Visualization | ✅ | `7d9fa72` |
| 5 — Polish + Deploy | ✅ | `eac6312` |

---

## Detail Phase yang Sudah Selesai

### Phase 1 — Scaffold + Auth ✅
**File yang dibuat:**
- `app/(auth)/login/page.tsx` — form login dengan react-hook-form + zod
- `app/(auth)/register/page.tsx` — form register + success state (cek email)
- `app/(auth)/layout.tsx` — shell centered, tanpa nav
- `app/(app)/layout.tsx` — server-side session check, redirect ke `/login` kalau tidak auth
- `app/page.tsx` — redirect ke `/tree`
- `app/layout.tsx` — root layout, font Geist, metadata "Family Tree"
- `app/globals.css` — Tailwind v4 + CSS custom properties
- `middleware.ts` — Supabase token refresh + route guard
- `lib/supabase/client.ts` — `createBrowserClient` (Client Components)
- `lib/supabase/server.ts` — `createServerClient` async factory (Server Components)
- `lib/utils.ts` — fungsi `cn()` (clsx + tailwind-merge)
- `components/ui/button.tsx` — Button component
- `components/ui/input.tsx` — Input component dengan label + error state
- `components/layout/BottomNav.tsx` — navigasi bawah mobile, 44px tap targets
- `supabase/migrations/0001_initial.sql` — schema: profiles, persons, relationships, RLS, unique index

### Phase 2 — Person CRUD ✅
**File yang dibuat:**
- `lib/types.ts` — types: `Person`, `Relationship`, `RelationshipType`, `PersonInsert`
- `lib/db/persons.ts` — `getPersons`, `getPerson`, `createPerson`, `updatePerson`, `deletePerson`, `uploadPersonPhoto`
- `hooks/usePersons.ts` — React Query hooks: `usePersons`, `usePerson`, `useCreatePerson`, `useUpdatePerson`, `useDeletePerson`
- `components/providers/ReactQueryProvider.tsx` — QueryClient provider, di-wrap di `app/layout.tsx`
- `components/members/PersonForm.tsx` — form tambah/edit dengan zod, upload foto ke Supabase Storage
- `components/members/PersonCard.tsx` — card untuk list view
- `app/(app)/members/page.tsx` + `MembersClient.tsx` — daftar anggota (server → client)
- `app/(app)/members/new/page.tsx` — form tambah anggota
- `app/(app)/members/[id]/page.tsx` — detail anggota
- `app/(app)/members/[id]/edit/page.tsx` — form edit anggota
- `components/ui/select.tsx`, `textarea.tsx` — UI primitives tambahan

### Phase 3 — Relationships ✅
**File yang dibuat:**
- `lib/db/relationships.ts` — `getRelationships`, `createRelationship` (LEAST/GREATEST canonical ordering), `deleteRelationship`
- `hooks/useRelationships.ts` — React Query hooks: `useRelationships`, `useCreateRelationship`, `useDeleteRelationship`
- `components/members/RelationshipForm.tsx` — form tambah relasi: pilih 2 person + tipe + tanggal opsional
- `components/members/RelationshipList.tsx` — list relasi di halaman detail person
- `components/ui/dialog.tsx` — Dialog modal (dibuat manual, bukan dari shadcn registry)

**Penting:** Supabase Storage bucket `person-photos` + RLS policy harus dibuat manual via Dashboard atau SQL Editor.

### Phase 4 — Tree Visualization ✅
**File yang dibuat:**
- `lib/tree/layout.ts` — pipeline: `persons[] + relationships[] → couple nodes → Dagre → React Flow nodes+edges`
- `hooks/useTreeData.ts` — fetch persons + relationships → `buildTreeLayout` via `useMemo`
- `components/tree/PersonNode.tsx` — custom React Flow node: foto, nama, tahun lahir/meninggal
- `components/tree/CoupleNode.tsx` — invisible node kecil antara pasangan (untuk routing parent-child edge)
- `components/tree/RelationshipEdge.tsx` — custom edge dengan warna per tipe relasi
- `components/tree/FamilyTreeCanvas.tsx` — canvas utama: React Flow + Controls + Background + MiniMap
- `app/(app)/tree/page.tsx` — halaman tree dengan FAB "Tambah Anggota"
- `next.config.ts` — whitelist `*.supabase.co` untuk Next.js Image

### Phase 5 — Polish + Deploy ✅
**File yang dibuat/dimodifikasi:**
- `app/(app)/loading.tsx`, `app/(app)/error.tsx` — fallback global untuk (app) routes
- `app/(app)/tree/loading.tsx`, `app/(app)/tree/error.tsx`
- `app/(app)/members/loading.tsx`, `app/(app)/members/error.tsx`
- Empty state di `MembersClient.tsx` untuk user baru
- `MiniMap` disembunyikan di bawah breakpoint `md:`
- Deploy ke Vercel dengan env vars + Supabase Auth redirect URL

---

## Setup Manual yang Diperlukan

1. Isi `.env.local` (jangan di-commit):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://oquxdreczzvxpxrcxjde.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Jalankan `supabase/migrations/0001_initial.sql` di Supabase SQL Editor
3. Buat bucket `person-photos` di Supabase Storage + RLS policies (lihat CLAUDE.md)
4. `npm install && npm run dev`

---

## Phase 6 — Search & Filter (NEXT)

### Tujuan
User bisa mencari anggota keluarga berdasarkan nama, dan memfilter daftar berdasarkan gender. Di tree canvas, tersedia quick-search untuk melompat ke node person tertentu.

### Lingkup

**A. Search di halaman Members (`/members`)**
- Search bar di atas list — filter real-time (client-side) berdasarkan `full_name`
- Filter chip: All / Laki-laki / Perempuan / Tidak diketahui
- State search/filter: `useState` lokal di `MembersClient.tsx` — tidak perlu query param / server state
- Tidak ada perubahan DB atau query baru — filter dilakukan di atas data yang sudah di-cache oleh React Query

**B. Quick-search di Tree Canvas (`/tree`)**
- Input search di pojok kiri atas canvas (di atas Controls React Flow)
- Ketik nama → daftar dropdown person yang cocok → klik → tree pan & zoom ke node tersebut
- Gunakan `useReactFlow().fitView({ nodes: [targetNode] })` untuk animasi pan/zoom
- Komponen baru: `components/tree/TreeSearch.tsx`

### File yang perlu diubah / dibuat

| File | Perubahan |
|---|---|
| `app/(app)/members/MembersClient.tsx` | Tambah state `search` + `genderFilter`; filter `persons` sebelum render |
| `components/tree/TreeSearch.tsx` | Komponen baru: input + dropdown + pan-to-node |
| `components/tree/FamilyTreeCanvas.tsx` | Mount `TreeSearch` di dalam `ReactFlowProvider` agar bisa akses `useReactFlow()` |

### Done when
- `/members`: ketik nama → list langsung terfilter; klik chip gender → list terfilter
- `/tree`: ketik nama → dropdown muncul → klik → canvas beranimasi ke node tersebut

---

## Catatan Arsitektur Penting

- **Jangan** inline Supabase calls di components — semua query lewat `lib/db/`
- **Jangan** pakai Zustand/Context untuk data remote — pakai TanStack Query
- Symmetric relationships (`spouse`, `ex_spouse`, `sibling`) wajib pakai canonical ordering di `createRelationship`
- shadcn registry tidak accessible dari dev environment ini — tambah UI components secara manual di `components/ui/`
- Dialog menggunakan `z-[60]`, di atas BottomNav (`z-50`)
- `useReactFlow()` hanya bisa dipakai di dalam komponen yang di-render di dalam `<ReactFlow>` atau `<ReactFlowProvider>`

---

## Referensi File Kritis

| File | Fungsi |
|---|---|
| `middleware.ts` | Token refresh + route guard — jangan diubah tanpa hati-hati |
| `supabase/migrations/0001_initial.sql` | Schema lengkap + RLS |
| `lib/tree/layout.ts` | Transformasi DB → couple nodes → Dagre → React Flow |
| `lib/db/relationships.ts` | Canonical ordering mencegah duplikat relasi |
| `lib/supabase/server.ts` | Dipakai di semua Server Components & Actions |
| `lib/supabase/client.ts` | Dipakai di semua Client Components |

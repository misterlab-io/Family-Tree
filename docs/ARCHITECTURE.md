# Family Tree — Architecture & Implementation Plan

## Ringkasan Proyek

Aplikasi web silsilah keluarga (family tree) berbasis mobile-first. User bisa mendaftarkan diri, memasukkan data anggota keluarga, dan melihat pohon silsilah secara interaktif. MVP di-deploy ke Vercel; arsitektur dirancang untuk memudahkan migrasi ke React Native di masa depan.

---

## Tech Stack

| Kebutuhan | Library / Service |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Auth + Database + Storage | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Tree visualization | `@xyflow/react` v12 (React Flow) |
| Layout engine | `@dagrejs/dagre` |
| Server state / caching | `@tanstack/react-query` v5 |
| Forms + validasi | `react-hook-form` + `zod` + `@hookform/resolvers` |
| UI primitives | shadcn/ui + Tailwind CSS v4 |
| Icons | `lucide-react` |
| Utilities | `date-fns`, `clsx`, `tailwind-merge` |

**Alasan React Flow dipilih** (bukan `react-family-tree` atau `d3-hierarchy`): pohon keluarga adalah *directed acyclic graph* (DAG), bukan tree murni. Relasi ex-spouse, multiple marriages, dan half-siblings tidak bisa direpresentasikan dengan library tree konvensional. React Flow mendukung arbitrary graph dengan custom node dan edge.

---

## Data Model

### Tabel & Relasi

```sql
-- Satu profil per user Supabase Auth
profiles (id → auth.users, display_name, created_at)

-- Anggota keluarga, dimiliki oleh satu user
persons (id, owner_id → profiles, full_name, gender, birth_date, death_date,
         birth_place, photo_url, bio, is_living, created_at, updated_at)

-- Relasi antar person, dimiliki oleh user yang sama
relationships (id, owner_id → profiles, person_a_id → persons,
               person_b_id → persons, relationship_type, start_date,
               end_date, notes, created_at)
```

### Tipe Relasi (enum `relationship_type`)

| Tipe | Arah | Konvensi |
|---|---|---|
| `parent_child` | Terarah | `person_a` = orangtua, `person_b` = anak |
| `spouse` | Simetris | Tidak ada arah; `person_a < person_b` (canonical) |
| `ex_spouse` | Simetris | Sama seperti spouse |
| `sibling` | Simetris | Sama seperti spouse |

Relasi simetris dijaga dari duplikat dengan partial unique index menggunakan `LEAST`/`GREATEST`:

```sql
CREATE UNIQUE INDEX uniq_rel_symmetric ON public.relationships(
  owner_id,
  LEAST(person_a_id::text, person_b_id::text),
  GREATEST(person_a_id::text, person_b_id::text),
  relationship_type
) WHERE relationship_type IN ('spouse','ex_spouse','sibling');
```

### Row-Level Security (RLS)

Semua tabel menggunakan RLS Supabase. Setiap user hanya bisa membaca dan menulis data miliknya sendiri (`owner_id = auth.uid()`).

File migrasi lengkap: `supabase/migrations/0001_initial.sql`

---

## Folder Structure

```
app/
  (auth)/
    layout.tsx                  # Shell minimal, centered, tanpa nav
    login/page.tsx
    register/page.tsx
  (app)/
    layout.tsx                  # Session check server-side + shell dengan nav
    tree/page.tsx               # Halaman utama: visualisasi pohon keluarga
    members/
      page.tsx                  # Daftar semua anggota
      new/page.tsx
      [id]/page.tsx
      [id]/edit/page.tsx
    settings/page.tsx

components/
  tree/
    FamilyTreeCanvas.tsx        # React Flow wrapper + inisialisasi layout
    PersonNode.tsx              # Custom node: foto, nama, tahun lahir/wafat
    RelationshipEdge.tsx        # Custom edge: styling per tipe relasi
    TreeControls.tsx            # Overlay zoom/pan/fit
  members/
    PersonForm.tsx              # Form tambah/edit person (RHF + Zod)
    RelationshipForm.tsx        # Form hubungkan dua person
    PersonCard.tsx
  layout/
    AppHeader.tsx
    BottomNav.tsx               # Navigasi bawah (mobile); diganti sidebar di md:

lib/
  supabase/
    client.ts                   # createBrowserClient — untuk Client Components
    server.ts                   # createServerClient — untuk Server Components & Actions
  db/
    persons.ts                  # getPersons, createPerson, updatePerson, deletePerson
    relationships.ts            # getRelationships, createRelationship, deleteRelationship
  tree/
    layout.ts                   # Transformasi DB → Dagre → React Flow nodes+edges
  types.ts                      # Shared TypeScript types

hooks/
  useTreeData.ts                # Fetch + transform data untuk React Flow
  usePersonMutations.ts
  useRelationshipMutations.ts

middleware.ts                   # Session refresh Supabase + route guard
supabase/
  migrations/
    0001_initial.sql
```

---

## Arsitektur Kunci

### 1. Tree Layout Pipeline

File terpenting secara arsitektural adalah `lib/tree/layout.ts`. Ini adalah layer transformasi yang mengubah data DB mentah menjadi posisi visual:

```
persons[] + relationships[]
  → insert "couple nodes" virtual antar pasangan
  → Dagre graph (nodes + edges)
  → dagre.layout() → x, y per node
  → React Flow nodes[] + edges[]
```

**Couple node pattern**: node invisible kecil disisipkan di antara dua pasangan. Edge parent-child berasal dari couple node ini, bukan dari masing-masing person. Hasilnya, anak tampil rapi di bawah kedua orangtua tanpa visual spaghetti.

### 2. Edge Styling

| Tipe | Visual |
|---|---|
| `spouse` | Solid biru |
| `ex_spouse` | Dashed abu-abu |
| `parent_child` | Solid hitam |
| `sibling` | Solid biru muda |

### 3. Middleware Supabase (Next.js 15)

`middleware.ts` di root **wajib** diimplementasikan untuk me-refresh token Supabase di setiap request. Tanpa ini, session akan kedaluwarsa secara diam-diam meski cookie masih ada. Middleware juga menangani redirect: user tidak terauth → `/login`; user terauth mengakses `/login` → `/tree`.

### 4. Dua Pattern Supabase Client

- `lib/supabase/client.ts` → `createBrowserClient` — singleton, dipakai di Client Components
- `lib/supabase/server.ts` → `createServerClient` — async factory, dipakai di Server Components, Server Actions, dan Route Handlers (akses `next/headers`)

### 5. State Management

Data remote (`persons[]`, `relationships[]`) dikelola dengan **TanStack Query** — bukan Zustand/Context — karena data ini adalah server state, bukan client state. React Query menangani caching, invalidation, dan optimistic updates secara otomatis. State UI lokal (modal open, selected node) tetap pakai `useState`.

---

## Build Phases

### Phase 1 — Scaffold + Auth
1. `npx create-next-app@latest . --typescript --tailwind --app`
2. `npx shadcn@latest init`
3. Install semua dependencies
4. Buat Supabase project → jalankan `0001_initial.sql` di SQL editor
5. Implement `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`
6. Build halaman `/login` dan `/register`
7. Build `(app)/layout.tsx` dengan server-side session check

**Done when**: register → login → lihat `/tree` yang diproteksi → logout → tidak bisa akses `/tree`

### Phase 2 — Person CRUD
1. Implement `lib/db/persons.ts`
2. Setup `ReactQueryProvider` + hook `useTreeData`
3. Build `PersonForm.tsx` dengan upload foto ke Supabase Storage
4. Wire halaman members (list, new, edit, detail)
5. Build `BottomNav`

**Done when**: tambah, lihat, edit, hapus anggota keluarga dengan foto

### Phase 3 — Relationships
1. Implement `lib/db/relationships.ts` (dengan canonical ordering LEAST/GREATEST)
2. Build `RelationshipForm.tsx` — combobox pilih 2 person + tipe + tanggal opsional
3. Tambah tombol "Connect" di `PersonCard` → modal `RelationshipForm`

**Done when**: bisa menghubungkan dua orang dengan tipe relasi yang benar

### Phase 4 — Tree Visualization *(fase terkompleks)*
1. Implement `lib/tree/layout.ts` dengan couple-node pattern + Dagre
2. Build `PersonNode.tsx` dan `RelationshipEdge.tsx`
3. Build `FamilyTreeCanvas.tsx` dengan `Controls`, `Background`, `MiniMap`
4. Wire `(app)/tree/page.tsx`
5. Tambah FAB "Add Person" di halaman tree
6. Mobile testing: pinch-zoom bekerja, tap targets min 44px

**Done when**: pohon tampil interaktif, bisa zoom/pan, tap node membuka detail person

### Phase 5 — Polish + Deploy
1. `loading.tsx` dan `error.tsx` per route
2. Empty state onboarding untuk user baru
3. `MiniMap` hanya tampil di `md:` ke atas
4. Set env vars di Vercel dashboard + Supabase Auth redirect URL
5. Deploy via GitHub integration ke Vercel
6. Update `CLAUDE.md`

---

## Critical Files

| File | Kenapa kritis |
|---|---|
| `supabase/migrations/0001_initial.sql` | Schema lengkap: tables, RLS, unique constraint relasi simetris |
| `middleware.ts` | Harus benar sebelum apapun bisa berjalan dengan auth |
| `lib/tree/layout.ts` | Layer transformasi DB → React Flow; paling novel secara arsitektural |
| `components/tree/FamilyTreeCanvas.tsx` | Core UX: visualisasi pohon keluarga |
| `lib/db/relationships.ts` | Canonical ordering mencegah data relasi corrupt/duplikat |

---

## React Native Migration Path

Saat migrasi ke Expo Router di masa depan:

- **Portable tanpa perubahan**: `lib/`, `hooks/`, `lib/types.ts` (murni Supabase JS SDK + TanStack Query, tidak ada dependensi web/native)
- **Perlu diganti**: `components/` (HTML → React Native components), React Flow (→ custom canvas dengan `react-native-svg` atau `react-native-reanimated`)
- **Struktur target**: monorepo Turborepo dengan `apps/web` (Next.js) dan `apps/mobile` (Expo), berbagi `packages/lib` dan `packages/hooks`

---

## Verification Checklist

- [ ] Auth: register → login → akses `/tree` → logout → `/tree` redirect ke `/login`
- [ ] CRUD: tambah person → edit → hapus → perubahan konsisten di UI
- [ ] Relasi: hubungkan A→B sebagai spouse → coba B→A sebagai spouse → ditolak DB (unique constraint)
- [ ] Visualisasi: buat family unit (2 pasangan + 2 anak) → layout tampil benar di tree
- [ ] Mobile: Chrome DevTools mobile view → pinch-zoom bekerja, semua node bisa di-tap
- [ ] Deploy: env vars terset di Vercel, Supabase Auth redirect URL terdaftar

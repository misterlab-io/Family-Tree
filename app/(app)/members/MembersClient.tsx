"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { usePersons } from "@/hooks/usePersons";
import { PersonCard } from "@/components/members/PersonCard";
import type { Gender } from "@/lib/types";

type GenderFilter = "all" | "male" | "female" | "other";

const GENDER_CHIPS: { value: GenderFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
  { value: "other", label: "Lainnya" },
];

function matchesGender(gender: Gender | null, filter: GenderFilter): boolean {
  if (filter === "all") return true;
  if (filter === "male") return gender === "male";
  if (filter === "female") return gender === "female";
  return gender === "non_binary" || gender === "unknown" || gender === null;
}

export function MembersClient({ userId }: { userId: string }) {
  const { data: persons, isLoading, isError } = usePersons(userId);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");

  const filtered = useMemo(() => {
    if (!persons) return [];
    const q = search.trim().toLowerCase();
    return persons.filter(
      (p) =>
        (!q || p.full_name.toLowerCase().includes(q)) &&
        matchesGender(p.gender, genderFilter)
    );
  }, [persons, search, genderFilter]);

  const hasPersons = !isLoading && !isError && persons && persons.length > 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Anggota Keluarga</h1>
        <Link
          href="/members/new"
          className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          aria-label="Tambah anggota"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      {/* Search + filter — only shown when there's data */}
      {hasPersons && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama anggota..."
              className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Hapus pencarian"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {GENDER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setGenderFilter(chip.value)}
                className={[
                  "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors",
                  genderFilter === chip.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:bg-accent",
                ].join(" ")}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-center text-sm text-destructive">
          Gagal memuat data. Coba refresh halaman.
        </p>
      )}

      {/* Empty state — no persons yet */}
      {!isLoading && !isError && persons?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">👨‍👩‍👧‍👦</span>
          <p className="font-semibold">Belum ada anggota</p>
          <p className="text-sm text-muted-foreground">
            Mulai dengan menambahkan anggota keluarga pertama.
          </p>
          <Link
            href="/members/new"
            className="mt-2 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Tambah Sekarang
          </Link>
        </div>
      )}

      {/* Empty state — no search results */}
      {hasPersons && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="font-medium">Tidak ada hasil</p>
          <p className="text-sm text-muted-foreground">
            Coba ubah kata kunci atau filter gender.
          </p>
        </div>
      )}

      {/* List */}
      {hasPersons && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}

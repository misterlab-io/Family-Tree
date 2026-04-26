"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePersons } from "@/hooks/usePersons";
import { PersonCard } from "@/components/members/PersonCard";

export function MembersClient({ userId }: { userId: string }) {
  const { data: persons, isLoading, isError } = usePersons(userId);

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

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-destructive">
          Gagal memuat data. Coba refresh halaman.
        </p>
      )}

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

      {!isLoading && !isError && persons && persons.length > 0 && (
        <div className="flex flex-col gap-3">
          {persons.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}

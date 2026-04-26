"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { usePerson, useDeletePerson } from "@/hooks/usePersons";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const { data: person, isLoading } = usePerson(id);
  const deletePerson = useDeletePerson(userId ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deletePerson.mutateAsync(id);
    router.push("/members");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">Anggota tidak ditemukan.</p>
        <Link href="/members" className="text-sm text-primary underline">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const genderLabel: Record<string, string> = {
    male: "Laki-laki",
    female: "Perempuan",
    non_binary: "Non-biner",
    unknown: "Tidak diketahui",
  };

  function formatDate(date: string) {
    return format(new Date(date), "d MMMM yyyy", { locale: localeId });
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full hover:bg-accent"
        >
          ←
        </button>
        <h1 className="flex-1 truncate text-xl font-bold">{person.full_name}</h1>
        <Link
          href={`/members/${id}/edit`}
          className="flex h-9 items-center rounded-md border border-input px-3 text-sm"
        >
          Edit
        </Link>
      </div>

      {/* Foto */}
      <div className="relative mx-auto size-28 overflow-hidden rounded-full bg-muted">
        {person.photo_url ? (
          <Image src={person.photo_url} alt={person.full_name} fill className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-4xl text-muted-foreground">
            {person.full_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Detail */}
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <DetailRow label="Jenis Kelamin" value={person.gender ? genderLabel[person.gender] : "–"} />
        <DetailRow label="Tanggal Lahir" value={person.birth_date ? formatDate(person.birth_date) : "–"} />
        <DetailRow label="Tempat Lahir" value={person.birth_place ?? "–"} />
        <DetailRow
          label="Status"
          value={
            person.is_living
              ? "Masih hidup"
              : person.death_date
              ? `Wafat ${formatDate(person.death_date)}`
              : "Almarhum/Almarhumah"
          }
        />
        {person.bio && <DetailRow label="Biografi" value={person.bio} />}
      </div>

      {/* Hapus */}
      <Button
        variant="destructive"
        onClick={handleDelete}
        loading={deletePerson.isPending}
        className="w-full"
      >
        {confirmDelete ? "Yakin hapus?" : "Hapus Anggota"}
      </Button>
      {confirmDelete && (
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-center text-sm text-muted-foreground underline"
        >
          Batal
        </button>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { PersonForm, type PersonFormValues } from "@/components/members/PersonForm";
import { useCreatePerson } from "@/hooks/usePersons";

export default function NewMemberPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const createPerson = useCreatePerson(userId ?? "");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  async function handleSubmit(values: PersonFormValues, photoFile?: File) {
    if (!userId) return;
    await createPerson.mutateAsync({
      input: {
        full_name: values.full_name,
        gender: values.gender ?? null,
        birth_date: values.birth_date || null,
        death_date: values.death_date || null,
        birth_place: values.birth_place || null,
        bio: values.bio || null,
        photo_url: null,
        is_living: values.is_living,
      },
      photoFile,
    });
    router.push("/members");
  }

  if (!userId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full hover:bg-accent"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Tambah Anggota</h1>
      </div>
      <PersonForm onSubmit={handleSubmit} submitLabel="Tambah Anggota" />
    </div>
  );
}

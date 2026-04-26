"use client";

import { useParams, useRouter } from "next/navigation";
import { usePerson, useUpdatePerson } from "@/hooks/usePersons";
import { PersonForm, type PersonFormValues } from "@/components/members/PersonForm";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const { data: person, isLoading } = usePerson(id);
  const updatePerson = useUpdatePerson(userId ?? "");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  async function handleSubmit(values: PersonFormValues, photoFile?: File) {
    await updatePerson.mutateAsync({
      id,
      input: {
        full_name: values.full_name,
        gender: values.gender ?? null,
        birth_date: values.birth_date || null,
        death_date: values.death_date || null,
        birth_place: values.birth_place || null,
        bio: values.bio || null,
        is_living: values.is_living,
      },
      photoFile,
    });
    router.push(`/members/${id}`);
  }

  if (isLoading) {
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
        <h1 className="text-xl font-bold">Edit Anggota</h1>
      </div>
      <PersonForm
        defaultValues={person ?? undefined}
        onSubmit={handleSubmit}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}

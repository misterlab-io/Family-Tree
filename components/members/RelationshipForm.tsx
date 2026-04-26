"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Person, RelationshipInsert, RelationshipType } from "@/lib/types";

const schema = z.object({
  other_person_id: z.string().uuid("Pilih anggota"),
  relationship_type: z.enum(["parent_child", "spouse", "ex_spouse", "sibling"]),
  // For parent_child only — does the current person come first as parent (this=parent)
  // or second as child (this=child)?
  parent_child_role: z.enum(["this_is_parent", "this_is_child"]).optional(),
});

type FormValues = z.infer<typeof schema>;

interface RelationshipFormProps {
  currentPerson: Person;
  candidates: Person[]; // semua persons kecuali currentPerson
  onSubmit: (input: RelationshipInsert) => Promise<void>;
}

const TYPE_LABELS: Record<RelationshipType, string> = {
  parent_child: "Orangtua / Anak",
  spouse: "Pasangan",
  ex_spouse: "Mantan pasangan",
  sibling: "Saudara kandung",
};

export function RelationshipForm({
  currentPerson,
  candidates,
  onSubmit,
}: RelationshipFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      relationship_type: "spouse",
      parent_child_role: "this_is_parent",
    },
  });

  const type = watch("relationship_type");

  async function handleFormSubmit(values: FormValues) {
    let person_a_id = currentPerson.id;
    let person_b_id = values.other_person_id;

    if (
      values.relationship_type === "parent_child" &&
      values.parent_child_role === "this_is_child"
    ) {
      // swap: other person is the parent
      person_a_id = values.other_person_id;
      person_b_id = currentPerson.id;
    }

    await onSubmit({
      person_a_id,
      person_b_id,
      relationship_type: values.relationship_type,
      start_date: null,
      end_date: null,
      notes: null,
    });
  }

  if (candidates.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Tambah anggota lain dulu untuk membuat hubungan.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
      <Select
        label="Tipe Hubungan"
        error={errors.relationship_type?.message}
        {...register("relationship_type")}
      >
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {type === "parent_child" && (
        <Select
          label={`${currentPerson.full_name} adalah …`}
          error={errors.parent_child_role?.message}
          {...register("parent_child_role")}
        >
          <option value="this_is_parent">Orangtua dari …</option>
          <option value="this_is_child">Anak dari …</option>
        </Select>
      )}

      <Select
        label="Anggota Lain"
        error={errors.other_person_id?.message}
        {...register("other_person_id")}
        defaultValue=""
      >
        <option value="" disabled>
          — Pilih anggota —
        </option>
        {candidates.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </Select>

      <Button type="submit" loading={isSubmitting} className="w-full">
        Hubungkan
      </Button>
    </form>
  );
}

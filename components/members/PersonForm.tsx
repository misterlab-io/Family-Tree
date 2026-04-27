"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Person } from "@/lib/types";

const schema = z
  .object({
    full_name: z.string().min(1, "Nama lengkap wajib diisi"),
    gender: z.enum(["male", "female"]).optional(),
    birth_date: z.string().optional(),
    death_date: z.string().optional(),
    birth_place: z.string().optional(),
    bio: z.string().optional(),
    is_living: z.boolean(),
  })
  .refine(
    (d) => !d.death_date || !d.is_living,
    { message: "Tanggal wafat tidak bisa diisi jika masih hidup", path: ["death_date"] }
  );

export type PersonFormValues = z.infer<typeof schema>;

interface PersonFormProps {
  defaultValues?: Partial<Person>;
  onSubmit: (values: PersonFormValues, photoFile?: File) => Promise<void>;
  submitLabel?: string;
}

export function PersonForm({
  defaultValues,
  onSubmit,
  submitLabel = "Simpan",
}: PersonFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    defaultValues?.photo_url ?? null
  );
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? "",
      gender:
        defaultValues?.gender === "male" || defaultValues?.gender === "female"
          ? defaultValues.gender
          : undefined,
      birth_date: defaultValues?.birth_date ?? "",
      death_date: defaultValues?.death_date ?? "",
      birth_place: defaultValues?.birth_place ?? "",
      bio: defaultValues?.bio ?? "",
      is_living: defaultValues?.is_living ?? true,
    },
  });

  const isLiving = watch("is_living");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleFormSubmit(values: PersonFormValues) {
    await onSubmit(values, photoFile);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {/* Foto */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Foto</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative mx-auto flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-input bg-muted transition-colors hover:bg-accent"
        >
          {photoPreview ? (
            <Image
              src={photoPreview}
              alt="preview"
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-2xl text-muted-foreground">+</span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Input
        label="Nama Lengkap *"
        placeholder="cth. Budi Santoso"
        error={errors.full_name?.message}
        {...register("full_name")}
      />

      <Select label="Jenis Kelamin" error={errors.gender?.message} {...register("gender")}>
        <option value="">— Pilih —</option>
        <option value="male">Laki-laki</option>
        <option value="female">Perempuan</option>
      </Select>

      <Input
        label="Tanggal Lahir"
        type="date"
        error={errors.birth_date?.message}
        {...register("birth_date")}
      />

      <Input
        label="Tempat Lahir"
        placeholder="cth. Jakarta"
        error={errors.birth_place?.message}
        {...register("birth_place")}
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_living"
          className="size-5 rounded"
          {...register("is_living")}
        />
        <label htmlFor="is_living" className="text-sm font-medium text-foreground">
          Masih hidup
        </label>
      </div>

      {!isLiving && (
        <Input
          label="Tanggal Wafat"
          type="date"
          error={errors.death_date?.message}
          {...register("death_date")}
        />
      )}

      <Textarea
        label="Biografi"
        placeholder="Catatan singkat tentang orang ini…"
        error={errors.bio?.message}
        {...register("bio")}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

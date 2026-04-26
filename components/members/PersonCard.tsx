"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Person } from "@/lib/types";

interface PersonCardProps {
  person: Person;
}

export function PersonCard({ person }: PersonCardProps) {
  const birthYear = person.birth_date
    ? format(new Date(person.birth_date), "yyyy")
    : null;
  const deathYear = person.death_date
    ? format(new Date(person.death_date), "yyyy")
    : null;

  const yearLabel = birthYear
    ? deathYear
      ? `${birthYear} – ${deathYear}`
      : `${birthYear} –`
    : null;

  const genderLabel: Record<string, string> = {
    male: "Laki-laki",
    female: "Perempuan",
    non_binary: "Non-biner",
    unknown: "–",
  };

  return (
    <Link
      href={`/members/${person.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors active:bg-accent"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
        {person.photo_url ? (
          <Image src={person.photo_url} alt={person.full_name} fill className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-xl text-muted-foreground">
            {person.full_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{person.full_name}</p>
        <p className="text-xs text-muted-foreground">
          {person.gender ? genderLabel[person.gender] : "–"}
          {yearLabel ? ` · ${yearLabel}` : ""}
        </p>
        {!person.is_living && (
          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Almarhum/Almarhumah
          </span>
        )}
      </div>

      <svg
        className="size-4 shrink-0 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

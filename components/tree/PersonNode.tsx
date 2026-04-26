"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Person } from "@/lib/types";

function PersonNodeComponent({ data }: NodeProps) {
  const person = data as unknown as Person;
  const router = useRouter();

  const birthYear = person.birth_date
    ? new Date(person.birth_date).getFullYear()
    : null;
  const deathYear = person.death_date
    ? new Date(person.death_date).getFullYear()
    : null;

  const yearLabel = birthYear
    ? deathYear
      ? `${birthYear}–${deathYear}`
      : `${birthYear}–`
    : null;

  const bgColor =
    person.gender === "male"
      ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800"
      : person.gender === "female"
      ? "bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-800"
      : "bg-card border-border";

  return (
    <button
      onClick={() => router.push(`/members/${person.id}`)}
      className={`flex w-[168px] items-center gap-2 rounded-xl border-2 p-2 shadow-sm transition-shadow hover:shadow-md active:scale-95 ${bgColor}`}
      style={{ height: 80 }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      {/* Also allow edges from sides for spouse connections */}
      <Handle type="target" position={Position.Left} id="left" className="!opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="!opacity-0" />

      {/* Avatar */}
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
        {person.photo_url ? (
          <Image
            src={person.photo_url}
            alt={person.full_name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
            {person.full_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-xs font-semibold leading-tight text-foreground">
          {person.full_name}
        </p>
        {yearLabel && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{yearLabel}</p>
        )}
        {!person.is_living && (
          <span className="mt-0.5 block text-[9px] text-muted-foreground">
            Alm.
          </span>
        )}
      </div>
    </button>
  );
}

export const PersonNode = memo(PersonNodeComponent);

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Person, Relationship, RelationshipType } from "@/lib/types";

interface RelationshipListProps {
  currentPersonId: string;
  relationships: Relationship[];
  personsById: Map<string, Person>;
  onDelete: (id: string) => void;
  deletingId?: string;
}

export function RelationshipList({
  currentPersonId,
  relationships,
  personsById,
  onDelete,
  deletingId,
}: RelationshipListProps) {
  if (relationships.length === 0) {
    return (
      <p className="rounded-lg bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
        Belum ada hubungan tercatat.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {relationships.map((rel) => {
        const otherId =
          rel.person_a_id === currentPersonId ? rel.person_b_id : rel.person_a_id;
        const other = personsById.get(otherId);
        if (!other) return null;

        const label = relationshipLabel(rel, currentPersonId);

        return (
          <li
            key={rel.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/members/${other.id}`}
                className="block truncate font-medium hover:underline"
              >
                {other.full_name}
              </Link>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(rel.id)}
              loading={deletingId === rel.id}
              aria-label="Hapus hubungan"
            >
              ✕
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function relationshipLabel(rel: Relationship, currentPersonId: string): string {
  const labels: Record<RelationshipType, string> = {
    spouse: "Pasangan",
    ex_spouse: "Mantan pasangan",
    sibling: "Saudara kandung",
    parent_child: "",
  };

  if (rel.relationship_type !== "parent_child") {
    return labels[rel.relationship_type];
  }

  return rel.person_a_id === currentPersonId ? "Orangtua dari" : "Anak dari";
}

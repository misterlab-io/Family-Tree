"use client";

import { useMemo } from "react";
import { usePersons } from "@/hooks/usePersons";
import { useRelationships } from "@/hooks/useRelationships";
import { buildTreeLayout } from "@/lib/tree/layout";

export function useTreeData(userId: string) {
  const {
    data: persons = [],
    isLoading: personsLoading,
    isError: personsError,
  } = usePersons(userId);

  const {
    data: relationships = [],
    isLoading: relsLoading,
    isError: relsError,
  } = useRelationships(userId);

  const { nodes, edges } = useMemo(
    () => buildTreeLayout(persons, relationships),
    [persons, relationships]
  );

  return {
    nodes,
    edges,
    persons,
    isLoading: personsLoading || relsLoading,
    isError: personsError || relsError,
  };
}

"use client";

import { useMemo } from "react";
import { usePersons } from "@/hooks/usePersons";
import { useRelationships } from "@/hooks/useRelationships";
import { useTreeLayout } from "@/hooks/useTreeLayout";
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

  const { data: customOrder } = useTreeLayout(userId);

  const { nodes, edges } = useMemo(
    () => buildTreeLayout(persons, relationships, customOrder),
    [persons, relationships, customOrder]
  );

  return {
    nodes,
    edges,
    persons,
    isLoading: personsLoading || relsLoading,
    isError: personsError || relsError,
  };
}

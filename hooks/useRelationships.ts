"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRelationships,
  createRelationship,
  deleteRelationship,
} from "@/lib/db/relationships";
import type { RelationshipInsert } from "@/lib/types";

export const RELATIONSHIPS_KEY = (userId: string) =>
  ["relationships", userId] as const;

export function useRelationships(userId: string) {
  return useQuery({
    queryKey: RELATIONSHIPS_KEY(userId),
    queryFn: () => getRelationships(userId),
    enabled: !!userId,
  });
}

export function useCreateRelationship(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RelationshipInsert) => createRelationship(userId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: RELATIONSHIPS_KEY(userId) }),
  });
}

export function useDeleteRelationship(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRelationship(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: RELATIONSHIPS_KEY(userId) }),
  });
}

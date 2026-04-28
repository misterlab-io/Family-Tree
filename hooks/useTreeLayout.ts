"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTreeNodePositions,
  saveTreeNodePositions,
  type TreeNodePosition,
} from "@/lib/db/treeLayout";

export const TREE_LAYOUT_KEY = (userId: string) =>
  ["treeLayout", userId] as const;

// Defined at module scope so the reference is stable across renders.
// TanStack Query only re-calls select when the raw query data changes.
function selectToMap(data: TreeNodePosition[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of data) map.set(row.person_id, row.x_order);
  return map;
}

export function useTreeLayout(userId: string) {
  return useQuery({
    queryKey: TREE_LAYOUT_KEY(userId),
    queryFn: () => getTreeNodePositions(userId),
    enabled: !!userId,
    select: selectToMap,
  });
}

export function useSaveTreeLayout(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderMap: Map<string, number>) =>
      saveTreeNodePositions(userId, orderMap),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: TREE_LAYOUT_KEY(userId) }),
  });
}

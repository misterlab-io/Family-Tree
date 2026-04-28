import { createClient } from "@/lib/supabase/client";

export interface TreeNodePosition {
  person_id: string;
  x_order: number;
}

export async function getTreeNodePositions(
  userId: string
): Promise<TreeNodePosition[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tree_node_positions")
    .select("person_id, x_order")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function saveTreeNodePositions(
  userId: string,
  orderMap: Map<string, number>
): Promise<void> {
  const supabase = createClient();
  const rows = [...orderMap.entries()].map(([person_id, x_order]) => ({
    user_id: userId,
    person_id,
    x_order,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("tree_node_positions")
    .upsert(rows, { onConflict: "user_id,person_id" });
  if (error) throw error;
}

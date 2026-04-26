import { createClient } from "@/lib/supabase/client";
import type { Relationship, RelationshipInsert, RelationshipType } from "@/lib/types";

const SYMMETRIC_TYPES: RelationshipType[] = ["spouse", "ex_spouse", "sibling"];

function canonicalize(input: RelationshipInsert): RelationshipInsert {
  if (!SYMMETRIC_TYPES.includes(input.relationship_type)) return input;
  const [a, b] =
    input.person_a_id < input.person_b_id
      ? [input.person_a_id, input.person_b_id]
      : [input.person_b_id, input.person_a_id];
  return { ...input, person_a_id: a, person_b_id: b };
}

export async function getRelationships(userId: string): Promise<Relationship[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("relationships")
    .select("*")
    .eq("owner_id", userId);

  if (error) throw error;
  return data ?? [];
}

export async function createRelationship(
  userId: string,
  input: RelationshipInsert
): Promise<Relationship> {
  const supabase = createClient();
  const canonical = canonicalize(input);

  const { data, error } = await supabase
    .from("relationships")
    .insert({ ...canonical, owner_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRelationship(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("relationships").delete().eq("id", id);
  if (error) throw error;
}

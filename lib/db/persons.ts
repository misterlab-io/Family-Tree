import { createClient } from "@/lib/supabase/client";
import type { Person, PersonInsert, PersonUpdate } from "@/lib/types";

export async function getPersons(userId: string): Promise<Person[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("owner_id", userId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createPerson(
  userId: string,
  input: PersonInsert
): Promise<Person> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("persons")
    .insert({ ...input, owner_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePerson(
  id: string,
  input: PersonUpdate
): Promise<Person> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("persons")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("persons").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPersonPhoto(
  userId: string,
  personId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${personId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("person-photos")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("person-photos").getPublicUrl(path);
  return data.publicUrl;
}

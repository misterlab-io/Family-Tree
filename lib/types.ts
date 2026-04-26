export type Gender = "male" | "female" | "non_binary" | "unknown";

export type RelationshipType =
  | "parent_child"
  | "spouse"
  | "ex_spouse"
  | "sibling";

export interface Person {
  id: string;
  owner_id: string;
  full_name: string;
  gender: Gender | null;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  photo_url: string | null;
  bio: string | null;
  is_living: boolean;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  owner_id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: RelationshipType;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

export type PersonInsert = Omit<Person, "id" | "owner_id" | "created_at" | "updated_at">;
export type PersonUpdate = Partial<PersonInsert>;

export type RelationshipInsert = Omit<Relationship, "id" | "owner_id" | "created_at">;

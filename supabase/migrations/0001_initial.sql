-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── PERSONS ─────────────────────────────────────────────────────────────────
CREATE TABLE public.persons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  gender      TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'unknown')),
  birth_date  DATE,
  death_date  DATE,
  birth_place TEXT,
  photo_url   TEXT,
  bio         TEXT,
  is_living   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_persons_owner ON public.persons(owner_id);

-- ─── RELATIONSHIPS ────────────────────────────────────────────────────────────
-- Relationship type conventions:
--   parent_child : person_a = parent,  person_b = child  (directed)
--   spouse       : unordered, enforced person_a < person_b via unique index
--   ex_spouse    : unordered, same as spouse
--   sibling      : unordered, same as spouse
CREATE TYPE relationship_type AS ENUM (
  'parent_child',
  'spouse',
  'ex_spouse',
  'sibling'
);

CREATE TABLE public.relationships (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  person_a_id       UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  person_b_id       UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL,
  start_date        DATE,
  end_date          DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_relationship CHECK (person_a_id <> person_b_id)
);

CREATE INDEX idx_rel_owner    ON public.relationships(owner_id);
CREATE INDEX idx_rel_person_a ON public.relationships(person_a_id);
CREATE INDEX idx_rel_person_b ON public.relationships(person_b_id);

-- Prevent duplicate undirected edges for symmetric relationship types
CREATE UNIQUE INDEX uniq_rel_symmetric ON public.relationships (
  owner_id,
  LEAST(person_a_id::text, person_b_id::text),
  GREATEST(person_a_id::text, person_b_id::text),
  relationship_type
) WHERE relationship_type IN ('spouse', 'ex_spouse', 'sibling');

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile"       ON public.profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "own persons"       ON public.persons
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "own relationships" ON public.relationships
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─── STORAGE ─────────────────────────────────────────────────────────────────
-- Create a 'person-photos' bucket in Supabase Dashboard → Storage, then run:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('person-photos', 'person-photos', false);
--
-- CREATE POLICY "owner upload" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'person-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "owner read" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'person-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)

-- ─── TREE NODE POSITIONS ─────────────────────────────────────────────────────
-- Stores the user's custom x-ordering for person nodes within each generation.
-- x_order is an integer rank (0, 1, 2, …) within that person's generation row.
CREATE TABLE public.tree_node_positions (
  user_id   UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  person_id UUID    NOT NULL REFERENCES public.persons(id)  ON DELETE CASCADE,
  x_order   INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, person_id)
);

CREATE INDEX idx_tree_pos_user ON public.tree_node_positions(user_id);

ALTER TABLE public.tree_node_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tree positions" ON public.tree_node_positions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- Table to store votes on AI feedback items
CREATE TABLE public.feedback_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_item_id text NOT NULL,
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feedback_item_id, user_id)
);

ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own feedback votes"
  ON public.feedback_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own feedback votes"
  ON public.feedback_votes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own feedback votes"
  ON public.feedback_votes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own feedback votes"
  ON public.feedback_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

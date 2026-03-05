
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  timestamp_in_track DOUBLE PRECISION NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own comments"
  ON public.comments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comments"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- Create todos table
CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  text text NOT NULL,
  timestamp_in_track double precision NOT NULL DEFAULT 0,
  is_done boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  source_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Users can read todos for analyses they own
CREATE POLICY "Users read own todos"
  ON public.todos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = todos.analysis_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert todos for analyses they own
CREATE POLICY "Users insert own todos"
  ON public.todos FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.analyses a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = todos.analysis_id AND p.user_id = auth.uid()
    )
  );

-- Users can update todos for analyses they own
CREATE POLICY "Users update own todos"
  ON public.todos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = todos.analysis_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete todos for analyses they own
CREATE POLICY "Users delete own todos"
  ON public.todos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = todos.analysis_id AND p.user_id = auth.uid()
    )
  );

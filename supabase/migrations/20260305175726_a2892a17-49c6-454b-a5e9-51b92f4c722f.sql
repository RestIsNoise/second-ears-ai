
-- Allow users to delete their own projects
CREATE POLICY "Users delete own projects" ON public.projects
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete analyses belonging to their projects
CREATE POLICY "Users delete own analyses" ON public.analyses
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = analyses.project_id AND projects.user_id = auth.uid()
  ));

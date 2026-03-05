
-- Drop all restrictive policies and recreate as permissive

-- PROJECTS table
DROP POLICY IF EXISTS "Users insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users read own projects" ON public.projects;

CREATE POLICY "Users read own projects" ON public.projects
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ANALYSES table
DROP POLICY IF EXISTS "Users read own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users insert own analyses" ON public.analyses;

CREATE POLICY "Users read own analyses" ON public.analyses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = analyses.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users insert own analyses" ON public.analyses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = analyses.project_id AND projects.user_id = auth.uid()
  ));

-- PROFILES table
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

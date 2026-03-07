
-- Create collaborator role enum
CREATE TYPE public.collaborator_role AS ENUM ('viewer', 'editor');

-- Create collaborators table
CREATE TABLE public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role collaborator_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (analysis_id, invited_email)
);

-- Enable RLS
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Owner of the analysis can manage collaborators
CREATE POLICY "Analysis owner can manage collaborators"
ON public.collaborators
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.analyses a
    JOIN public.projects p ON p.id = a.project_id
    WHERE a.id = collaborators.analysis_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analyses a
    JOIN public.projects p ON p.id = a.project_id
    WHERE a.id = collaborators.analysis_id AND p.user_id = auth.uid()
  )
);

-- Collaborators can read their own invitation
CREATE POLICY "Collaborators can read own invites"
ON public.collaborators
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add is_public column to analyses for public link sharing
ALTER TABLE public.analyses ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Allow public read when is_public is true
CREATE POLICY "Public can read public analyses"
ON public.analyses
FOR SELECT
TO anon
USING (is_public = true);

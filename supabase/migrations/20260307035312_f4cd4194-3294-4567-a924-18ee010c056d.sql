ALTER TABLE public.analyses
  ADD COLUMN version integer NOT NULL DEFAULT 1,
  ADD COLUMN parent_analysis_id uuid REFERENCES public.analyses(id);
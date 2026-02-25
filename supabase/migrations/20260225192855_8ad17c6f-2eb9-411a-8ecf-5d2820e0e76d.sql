-- Create storage bucket for audio tracks
INSERT INTO storage.buckets (id, name, public) VALUES ('tracks', 'tracks', false);

-- Storage policies - anyone can upload (no auth required for MVP)
CREATE POLICY "Anyone can upload tracks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tracks');
CREATE POLICY "Anyone can read their uploaded tracks" ON storage.objects FOR SELECT USING (bucket_id = 'tracks');

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  listening_mode TEXT NOT NULL CHECK (listening_mode IN ('technical', 'musical', 'perception')),
  feedback JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access for MVP (no auth)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read feedback" ON public.feedback FOR SELECT USING (true);
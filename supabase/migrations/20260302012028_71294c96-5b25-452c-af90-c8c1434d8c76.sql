UPDATE storage.buckets SET public = true WHERE id = 'tracks';

CREATE POLICY "Allow anonymous uploads to tracks"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'tracks');

CREATE POLICY "Allow public read access to tracks"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'tracks');

CREATE POLICY "Allow anonymous delete from tracks"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'tracks');
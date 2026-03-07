
-- Drop the broken policy that references auth.users directly
DROP POLICY IF EXISTS "Collaborators can read own invites" ON public.collaborators;

-- Create a security definer function to get user email safely
CREATE OR REPLACE FUNCTION public.get_user_email(uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = uid
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Collaborators can read own invites"
ON public.collaborators
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR invited_email = public.get_user_email(auth.uid()));

import { supabase } from './supabaseClient';

export const BACKEND = 'https://secondears-backend-production.up.railway.app';

/** Returns headers with x-api-key + Authorization JWT (when session exists). */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'x-api-key': 'secondears-secret-2024' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://nllfubvokhybmtnnqeuk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbGZ1YnZva2h5Ym10bm5xZXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjg5OTcsImV4cCI6MjA4NzY0NDk5N30.UbB8lgoizmDtCgjAdJIZlEvBpvKfbt7hUnqMDIGHewc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

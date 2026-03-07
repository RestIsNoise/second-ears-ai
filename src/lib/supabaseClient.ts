import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://ltkkcqthnnnyskvomjeb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0a2tjcXRobm5ueXNrdm9tamViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDU2ODIsImV4cCI6MjA4NzYyMTY4Mn0.U3QvIjgS8RMNxIVDnMs7U5iYw7NVo8pazMmpyZBKDBw";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

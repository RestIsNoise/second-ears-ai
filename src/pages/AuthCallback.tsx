import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase client auto-detects hash fragments and exchanges them for a session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard", { replace: true });
      } else if (event === "INITIAL_SESSION" && !session) {
        // No session after processing hash — fallback
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            navigate(s ? "/dashboard" : "/auth", { replace: true });
          });
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
};

export default AuthCallback;

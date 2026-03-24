import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // PKCE flow: exchange the ?code= param for a session
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          navigate("/dashboard", { replace: true });
          return;
        }
      }

      // Fallback: check if a session already exists
      const { data: { session } } = await supabase.auth.getSession();
      navigate(session ? "/dashboard" : "/auth", { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
};

export default AuthCallback;

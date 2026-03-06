import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Try code exchange (PKCE flow)
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        navigate(error ? "/auth" : "/dashboard", { replace: true });
        return;
      }

      // 2. Try hash fragment (implicit flow)
      const hash = window.location.hash.substring(1);
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          navigate(error ? "/auth" : "/dashboard", { replace: true });
          return;
        }
      }

      // 3. Fallback — check existing session
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

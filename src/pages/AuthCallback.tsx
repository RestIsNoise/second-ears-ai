import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Brief delay to let Supabase client process any hash fragment automatically
      await new Promise((r) => setTimeout(r, 500));
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

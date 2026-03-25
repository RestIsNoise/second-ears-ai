import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://www.secondear.app/auth/callback",
      },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 380,
          background: "#111",
          border: "1px solid #222",
          borderRadius: 4,
          padding: "40px 48px",
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            letterSpacing: "0.15em",
            color: "#555",
            textTransform: "uppercase" as const,
          }}
        >
          SecondEar
        </p>

        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#e8e8e0",
            marginTop: 24,
            marginBottom: 6,
          }}
        >
          Sign in
        </h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 28 }}>
          Continue with your Google account.
        </p>

        <button
          onClick={handleGoogle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 12,
            border: "1px solid #2a2a2a",
            borderRadius: 3,
            background: "#1a1a1a",
            color: "#e8e8e0",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p
          style={{
            fontSize: 11,
            color: "#444",
            fontFamily: "monospace",
            textAlign: "center" as const,
            marginTop: 20,
          }}
        >
          No credit card required · Private by default
        </p>
      </div>
    </div>
  );
};

export default Auth;

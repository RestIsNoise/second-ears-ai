import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#f5f5f3" }}
    >
      <div className="text-center px-6">
        <p
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "#999",
            textTransform: "uppercase",
            marginBottom: 24,
            fontWeight: 600,
          }}
        >
          404
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>
          Nothing here.
        </h1>
        <p style={{ fontSize: 15, color: "#666", marginTop: 8, marginBottom: 32 }}>
          This page doesn't exist or was moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #ddd",
              background: "transparent",
              color: "#333",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

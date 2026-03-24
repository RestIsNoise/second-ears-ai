import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div
    className="min-h-screen flex items-center justify-center relative overflow-hidden"
    style={{ background: "#0a0a0a" }}
  >
    {/* Top-left wordmark */}
    <Link
      to="/"
      className="absolute top-5 left-6 z-10"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "#e8e8e0",
        textTransform: "uppercase",
        textDecoration: "none",
      }}
    >
      SecondEar
    </Link>

    {/* Giant decorative 404 */}
    <span
      aria-hidden="true"
      className="absolute select-none pointer-events-none"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 120,
        fontWeight: 900,
        color: "#1a1a1a",
        lineHeight: 1,
      }}
    >
      404
    </span>

    {/* Content */}
    <div className="relative z-10 text-center px-6">
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "#555",
          textTransform: "uppercase",
          marginBottom: 16,
          fontWeight: 600,
        }}
      >
        Page not found
      </p>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#e8e8e0",
          letterSpacing: "-0.01em",
        }}
      >
        You took a wrong turn.
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          color: "#555",
          marginTop: 8,
        }}
      >
        This page doesn't exist or was moved.
      </p>
      <div className="flex flex-col items-center gap-3 mt-8">
        <Button variant="default" size="sm" asChild>
          <Link to="/dashboard">→ Go to Dashboard</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className="text-[#888] hover:text-[#e8e8e0]">
          <Link to="/">← Back to home</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default NotFound;

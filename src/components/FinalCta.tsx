import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";

const FinalCta = () => (
  <section className="relative overflow-hidden py-20 md:py-28 px-6">
    {/* Atmospheric gradient background */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(to bottom, hsl(var(--background)), hsl(0 0% 6%), hsl(0 0% 4%))",
      }}
    />

    {/* Subtle noise grain */}
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      aria-hidden="true"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: "512px 512px",
      }}
    />

    {/* Ambient halo */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[120px] pointer-events-none"
      aria-hidden="true"
      style={{ background: "hsl(0 0% 18% / 0.4)" }}
    />

    <div className="relative max-w-xl mx-auto text-center">
      <h2
        className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4"
        style={{ color: "hsl(0 0% 94%)" }}
      >
        Your next mix decision is waiting.
      </h2>

      <p
        className="text-[14px] sm:text-[15px] leading-relaxed font-light mb-8"
        style={{ color: "hsl(0 0% 55%)" }}
      >
        Upload your track. Get timestamped feedback. Fix with a clear plan.
      </p>

      <Button
        variant="hero"
        size="lg"
        className="h-12 px-10 text-[13px] gap-2"
        asChild
      >
        <Link to="/analyze">
          <Upload className="w-4 h-4" />
          Start free analysis
        </Link>
      </Button>

      <p
        className="mt-5 text-[11px] tracking-wide"
        style={{ color: "hsl(0 0% 38%)" }}
      >
        3 free analyses per month · No credit card required
      </p>
    </div>
  </section>
);

export default FinalCta;

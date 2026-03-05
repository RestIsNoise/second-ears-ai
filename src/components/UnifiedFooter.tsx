import { Button } from "@/components/ui/button";
import { Upload, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const UnifiedFooter = () => (
  <footer className="relative overflow-hidden">
    {/* Light-to-dark gradient background spanning the entire footer */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(to bottom, hsl(var(--background)), hsl(0 0% 6%) 40%, hsl(0 0% 4%))",
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

    <div className="relative">
      {/* ── Final CTA ── */}
      <div className="pt-14 md:pt-16 pb-10 md:pb-12 px-6">
        {/* Ambient halo */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
          style={{ background: "hsl(0 0% 18% / 0.4)", marginTop: "-80px" }}
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
          <Button variant="hero" size="lg" className="h-12 px-10 text-[13px] gap-2" asChild>
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
      </div>

      {/* ── Contact ── */}
      <div className="pt-8 md:pt-10 pb-10 md:pb-14 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
            Get in touch
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2" style={{ color: "hsl(0 0% 94%)" }}>
            Contact
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
            Billing, feedback quality, feature requests. We read every message.
          </p>
          <Button variant="hero" size="lg" className="h-11 px-8 text-[13px] gap-2" asChild>
            <a href="mailto:hello@secondears.io">
              <Mail className="w-4 h-4" />
              hello@secondears.io
            </a>
          </Button>
          <p className="text-[11px] text-muted-foreground/50 mt-3">
            Response within 24–48h
          </p>
        </div>
      </div>

      {/* ── Legal row ── */}
      <div className="pt-6 pb-10 md:pb-14 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-5">
          <span className="font-mono-brand text-xs tracking-tight text-foreground/40">
            SecondEars™
          </span>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/20">·</span>
            <Link
              to="/terms"
              className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-muted-foreground/20">·</span>
            <Link
              to="/faq"
              className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
            >
              FAQ
            </Link>
            <span className="text-muted-foreground/20">·</span>
            <a
              href="mailto:hello@secondears.io"
              className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
            >
              Contact
            </a>
          </div>
          <p className="text-[10px] text-muted-foreground/30 tracking-wide">
            © {new Date().getFullYear()} SecondEars. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default UnifiedFooter;

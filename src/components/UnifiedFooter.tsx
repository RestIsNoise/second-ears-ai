import { Button } from "@/components/ui/button";
import { Upload, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const UnifiedFooter = () => (
  <footer>
    {/* ── White CTA block ── */}
    <section className="bg-background py-16 md:py-20 px-6">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
          Your next mix decision is waiting.
        </h2>
        <p className="text-[14px] sm:text-[15px] leading-relaxed font-light text-muted-foreground mb-8">
          Upload your track. Get timestamped feedback. Fix with a clear plan.
        </p>
        <Button variant="hero" size="lg" className="h-12 px-10 text-[13px] gap-2" asChild>
          <Link to="/analyze">
            <Upload className="w-4 h-4" />
            Start free analysis
          </Link>
        </Button>
        <p className="mt-5 text-[11px] tracking-wide text-muted-foreground/60">
          3 free analyses per month · No credit card required
        </p>
      </div>
    </section>

    {/* ── Dark Contact + Legal area ── */}
    <section
      className="relative overflow-hidden"
      style={{ background: "hsl(0 0% 5%)" }}
    >
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
        {/* Contact */}
        <div className="pt-12 md:pt-14 pb-10 md:pb-12 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <p className="font-mono-brand text-xs tracking-widest uppercase mb-3" style={{ color: "hsl(0 0% 50%)" }}>
              Get in touch
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2" style={{ color: "hsl(0 0% 92%)" }}>
              Contact
            </h2>
            <p className="text-sm max-w-sm mx-auto mb-6 leading-relaxed" style={{ color: "hsl(0 0% 55%)" }}>
              Billing, feedback quality, feature requests. We read every message.
            </p>
            <Button variant="hero" size="lg" className="h-11 px-8 text-[13px] gap-2" asChild>
              <a href="mailto:hello@secondears.io">
                <Mail className="w-4 h-4" />
                hello@secondears.io
              </a>
            </Button>
            <p className="text-[11px] mt-3" style={{ color: "hsl(0 0% 42%)" }}>
              Response within 24–48h
            </p>
          </div>
        </div>

        {/* Legal row */}
        <div className="pt-6 pb-10 md:pb-14 px-6 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-5">
            <span className="font-mono-brand text-xs tracking-tight" style={{ color: "hsl(0 0% 35%)" }}>
              SecondEars™
            </span>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-[10px] tracking-wide transition-colors" style={{ color: "hsl(0 0% 42%)" }}>
                Privacy Policy
              </Link>
              <span style={{ color: "hsl(0 0% 22%)" }}>·</span>
              <Link to="/terms" className="text-[10px] tracking-wide transition-colors" style={{ color: "hsl(0 0% 42%)" }}>
                Terms of Service
              </Link>
              <span style={{ color: "hsl(0 0% 22%)" }}>·</span>
              <Link to="/faq" className="text-[10px] tracking-wide transition-colors" style={{ color: "hsl(0 0% 42%)" }}>
                FAQ
              </Link>
              <span style={{ color: "hsl(0 0% 22%)" }}>·</span>
              <a href="mailto:hello@secondears.io" className="text-[10px] tracking-wide transition-colors" style={{ color: "hsl(0 0% 42%)" }}>
                Contact
              </a>
            </div>
            <p className="text-[10px] tracking-wide" style={{ color: "hsl(0 0% 30%)" }}>
              © {new Date().getFullYear()} SecondEars. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>
  </footer>
);

export default UnifiedFooter;

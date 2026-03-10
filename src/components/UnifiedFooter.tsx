import { Button } from "@/components/ui/button";
import { Upload, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const UnifiedFooter = () => {
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal();
  const { ref: contactRef, isVisible: contactVisible } = useScrollReveal();

  return (
    <footer>
      {/* ── Minimal CTA block ── */}
      <section
        ref={ctaRef}
        className={`bg-background py-12 md:py-16 px-6 reveal-base ${ctaVisible ? "reveal-visible" : ""}`}
      >
        <div className="max-w-xl mx-auto text-center">
          <Button variant="hero" size="lg" className="h-14 px-14 text-[15px] gap-2.5 reveal-child" style={{ "--reveal-delay": "0ms" } as React.CSSProperties} asChild>
            <Link to="/analyze">
              <Upload className="w-4 h-4" />
              Start free analysis
            </Link>
          </Button>
          <p className="mt-4 text-[11px] tracking-wide text-muted-foreground/45 reveal-child" style={{ "--reveal-delay": "80ms" } as React.CSSProperties}>
            No credit card required
          </p>
        </div>
      </section>

      {/* ── Dark Contact + Legal area ── */}
      <section
        ref={contactRef}
        className={`relative overflow-hidden reveal-base ${contactVisible ? "reveal-visible" : ""}`}
        style={{ background: "hsl(0 0% 5%)" }}
      >
        {/* Wider, smoother top gradient for better transition */}
        <div
          className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
          aria-hidden="true"
          style={{
            background: "linear-gradient(to bottom, hsl(var(--background)), hsl(0 0% 5%))",
          }}
        />

        {/* Noise grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "512px 512px",
          }}
        />

        {/* Ambient halos */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-[50%] left-[10%] w-[350px] h-[350px] rounded-full blur-[160px]"
            style={{ background: "hsl(0 0% 14% / 0.25)" }}
          />
          <div
            className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full blur-[140px]"
            style={{ background: "hsl(0 0% 18% / 0.2)" }}
          />
        </div>

        <div className="relative">
          {/* Contact */}
          <div className="pt-20 md:pt-24 pb-10 md:pb-12 px-6">
            <div className="max-w-5xl mx-auto text-center">
              <p
                className="text-[10px] tracking-[0.18em] uppercase mb-3 reveal-child"
                style={{ color: "hsl(0 0% 52%)", fontFamily: "'IBM Plex Mono', monospace", "--reveal-delay": "0ms" } as React.CSSProperties}
              >
                Get in touch
              </p>
              <h2
                className="text-2xl md:text-[1.75rem] font-semibold tracking-tight mb-2.5 reveal-child"
                style={{ color: "hsl(0 0% 93%)", "--reveal-delay": "60ms" } as React.CSSProperties}
              >
                Contact
              </h2>
              <p
                className="text-[13px] max-w-sm mx-auto mb-6 leading-relaxed reveal-child"
                style={{ color: "hsl(0 0% 58%)", "--reveal-delay": "120ms" } as React.CSSProperties}
              >
                Billing, feedback quality, feature requests. We read every message.
              </p>
              <div className="reveal-child" style={{ "--reveal-delay": "180ms" } as React.CSSProperties}>
                <Button variant="hero" size="lg" className="h-11 px-8 text-[13px] gap-2" asChild>
                  <a href="mailto:hello@secondears.io">
                    <Mail className="w-4 h-4" />
                    hello@secondears.io
                  </a>
                </Button>
              </div>
              <p className="text-[11px] mt-3 reveal-child" style={{ color: "hsl(0 0% 46%)", "--reveal-delay": "220ms" } as React.CSSProperties}>
                Response within 24–48h
              </p>
            </div>
          </div>

          {/* Legal row */}
          <div className="pt-6 pb-10 md:pb-14 px-6 border-t border-white/[0.06]">
            <div className="max-w-5xl mx-auto flex flex-col items-center gap-5">
              <span
                className="text-[11px] tracking-tight"
                style={{ color: "hsl(0 0% 40%)", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                SecondEar™
              </span>
              <div className="flex items-center gap-4">
                {[
                  { to: "/privacy", label: "Privacy Policy" },
                  { to: "/terms", label: "Terms of Service" },
                  { to: "/faq", label: "FAQ" },
                ].map((link, i) => (
                  <span key={link.to} className="flex items-center gap-4">
                    {i > 0 && <span style={{ color: "hsl(0 0% 26%)" }}>·</span>}
                    <Link
                      to={link.to}
                      className="text-[10px] tracking-wide transition-colors"
                      style={{ color: "hsl(0 0% 46%)" }}
                    >
                      {link.label}
                    </Link>
                  </span>
                ))}
                <span style={{ color: "hsl(0 0% 26%)" }}>·</span>
                <a
                  href="mailto:hello@secondears.io"
                  className="text-[10px] tracking-wide transition-colors"
                  style={{ color: "hsl(0 0% 46%)" }}
                >
                  Contact
                </a>
              </div>
              <p className="text-[10px] tracking-wide" style={{ color: "hsl(0 0% 35%)" }}>
                © {new Date().getFullYear()} SecondEar. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
};

export default UnifiedFooter;

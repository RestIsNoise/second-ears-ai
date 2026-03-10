import { Button } from "@/components/ui/button";
import { Upload, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const UnifiedFooter = () => {
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal();
  const { ref: contactRef, isVisible: contactVisible } = useScrollReveal();

  return (
    <footer>
      {/* ── CTA block on graduated surface ── */}
      <section
        ref={ctaRef}
        className={`relative py-16 md:py-20 px-6 reveal ${ctaVisible ? "is-visible" : ""}`}
        style={{
          background: "linear-gradient(to bottom, hsl(var(--surface-a)), hsl(var(--surface-b)) 60%, hsl(var(--surface-c)))",
        }}
      >
        <div className="channel-strip-line absolute top-0 left-0 right-0" />

        <div className="max-w-xl mx-auto text-center">
          <p
            className="text-[10px] text-muted-foreground/45 tracking-[0.18em] uppercase mb-5 reveal-child"
            style={{ fontFamily: "'IBM Plex Mono', monospace", "--stagger": "0ms" } as React.CSSProperties}
          >
            Ready to hear your mix
          </p>
          <div className="reveal-child" style={{ "--stagger": "80ms" } as React.CSSProperties}>
            <Button variant="hero" size="lg" className="h-14 px-14 text-[13px] gap-2.5" asChild>
              <Link to="/analyze">
                <Upload className="w-4 h-4" />
                Start free analysis
              </Link>
            </Button>
          </div>
          <p
            className="mt-3.5 text-[11px] tracking-wide text-muted-foreground/35 reveal-child"
            style={{ "--stagger": "160ms" } as React.CSSProperties}
          >
            No credit card required
          </p>
        </div>
      </section>

      {/* ── Graduated dark transition ── */}
      <div
        className="relative h-24 md:h-32 pointer-events-none overflow-hidden"
        aria-hidden="true"
        style={{
          background: "linear-gradient(to bottom, hsl(var(--surface-c)) 0%, hsl(0 0% 12%) 35%, hsl(0 0% 7%) 70%, hsl(0 0% 5%) 100%)",
        }}
      >
        {/* Faint center line running through */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(to bottom, hsl(var(--border-subtle) / 0.2), hsl(0 0% 100% / 0.03), transparent)" }}
        />
        {/* Horizontal rule at midpoint */}
        <div
          className="absolute top-1/2 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 10%, hsl(0 0% 100% / 0.04) 30%, hsl(0 0% 100% / 0.04) 70%, transparent 90%)" }}
        />
      </div>

      {/* ── Dark Contact + Legal area ── */}
      <section
        ref={contactRef}
        className={`relative overflow-hidden reveal ${contactVisible ? "is-visible" : ""}`}
        style={{ background: "hsl(0 0% 5%)" }}
      >
        {/* Noise grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "512px 512px",
          }}
        />

        {/* Subtle top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
          aria-hidden="true"
          style={{
            background: "radial-gradient(ellipse 50% 100% at 50% 0%, hsl(0 0% 10% / 0.6), transparent)",
          }}
        />

        <div className="relative">
          {/* Contact */}
          <div className="pt-16 md:pt-20 pb-12 md:pb-14 px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center gap-3 justify-center mb-4 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
                <div className="h-px w-10" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
                <p
                  className="text-[10px] tracking-[0.18em] uppercase"
                  style={{ color: "hsl(0 0% 38%)", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Get in touch
                </p>
                <div className="h-px w-10" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
              </div>
              <h2
                className="text-[1.35rem] md:text-[1.5rem] font-semibold tracking-[-0.03em] mb-3 reveal-child"
                style={{ color: "hsl(0 0% 90%)", "--stagger": "90ms" } as React.CSSProperties}
              >
                Contact
              </h2>
              <p
                className="text-[12.5px] max-w-sm mx-auto mb-7 leading-relaxed reveal-child"
                style={{ color: "hsl(0 0% 45%)", "--stagger": "180ms" } as React.CSSProperties}
              >
                Billing, feedback quality, feature requests. We read every message.
              </p>
              <div className="reveal-child" style={{ "--stagger": "260ms" } as React.CSSProperties}>
                <Button variant="hero" size="lg" className="h-11 px-8 text-[12px] gap-2" asChild>
                  <a href="mailto:hello@secondears.io">
                    <Mail className="w-4 h-4" />
                    hello@secondears.io
                  </a>
                </Button>
              </div>
              <p className="text-[10px] mt-3 reveal-child" style={{ color: "hsl(0 0% 38%)", "--stagger": "320ms" } as React.CSSProperties}>
                Response within 24–48h
              </p>
            </div>
          </div>

          {/* Legal row */}
          <div
            className="pt-5 pb-8 md:pb-12 px-6"
            style={{ borderTop: "1px solid hsl(0 0% 100% / 0.05)" }}
          >
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
              <span
                className="text-[11px] tracking-tight"
                style={{ color: "hsl(0 0% 34%)", fontFamily: "'IBM Plex Mono', monospace" }}
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
                    {i > 0 && <span style={{ color: "hsl(0 0% 20%)" }}>·</span>}
                    <Link
                      to={link.to}
                      className="text-[10px] tracking-wide transition-colors"
                      style={{ color: "hsl(0 0% 40%)" }}
                    >
                      {link.label}
                    </Link>
                  </span>
                ))}
                <span style={{ color: "hsl(0 0% 20%)" }}>·</span>
                <a
                  href="mailto:hello@secondears.io"
                  className="text-[10px] tracking-wide transition-colors"
                  style={{ color: "hsl(0 0% 40%)" }}
                >
                  Contact
                </a>
              </div>
              <p className="text-[10px] tracking-wide" style={{ color: "hsl(0 0% 30%)" }}>
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

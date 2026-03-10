import { Button } from "@/components/ui/button";
import { Upload, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const UnifiedFooter = () => {
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal();
  const { ref: contactRef, isVisible: contactVisible } = useScrollReveal();

  return (
    <footer>
      {/* ── CTA block ── */}
      <section
        ref={ctaRef}
        className={`relative py-16 md:py-20 px-6 reveal ${ctaVisible ? "is-visible" : ""}`}
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "hsl(var(--border-subtle) / 0.5)" }} />

        <div className="max-w-xl mx-auto text-center">
          <p
            className="text-[10px] text-muted-foreground/50 tracking-[0.2em] uppercase mb-6 reveal-child"
            style={{ fontFamily: "'IBM Plex Mono', monospace", "--stagger": "0ms" } as React.CSSProperties}
          >
            Ready to hear your mix
          </p>
          <div className="reveal-child" style={{ "--stagger": "80ms" } as React.CSSProperties}>
            <Button variant="hero" size="lg" className="h-14 px-14 text-[14px] gap-2.5" asChild>
              <Link to="/analyze">
                <Upload className="w-4 h-4" />
                Start free analysis
              </Link>
            </Button>
          </div>
          <p
            className="mt-4 text-[11px] tracking-wide text-muted-foreground/40 reveal-child"
            style={{ "--stagger": "160ms" } as React.CSSProperties}
          >
            No credit card required
          </p>
        </div>
      </section>

      {/* ── Gradient transition to dark ── */}
      <div
        className="h-24 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(0 0% 6%) 50%, hsl(0 0% 5%) 100%)",
        }}
      />

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

        <div className="relative">
          {/* Contact */}
          <div className="pt-14 md:pt-16 pb-12 md:pb-14 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <p
                className="text-[10px] tracking-[0.2em] uppercase mb-4 reveal-child"
                style={{ color: "hsl(0 0% 45%)", fontFamily: "'IBM Plex Mono', monospace", "--stagger": "0ms" } as React.CSSProperties}
              >
                Get in touch
              </p>
              <h2
                className="text-[1.5rem] md:text-[1.65rem] font-semibold tracking-[-0.03em] mb-3 reveal-child"
                style={{ color: "hsl(0 0% 92%)", "--stagger": "90ms" } as React.CSSProperties}
              >
                Contact
              </h2>
              <p
                className="text-[13px] max-w-sm mx-auto mb-7 leading-relaxed reveal-child"
                style={{ color: "hsl(0 0% 50%)", "--stagger": "180ms" } as React.CSSProperties}
              >
                Billing, feedback quality, feature requests. We read every message.
              </p>
              <div className="reveal-child" style={{ "--stagger": "260ms" } as React.CSSProperties}>
                <Button variant="hero" size="lg" className="h-11 px-8 text-[13px] gap-2" asChild>
                  <a href="mailto:hello@secondears.io">
                    <Mail className="w-4 h-4" />
                    hello@secondears.io
                  </a>
                </Button>
              </div>
              <p className="text-[10px] mt-3.5 reveal-child" style={{ color: "hsl(0 0% 42%)", "--stagger": "320ms" } as React.CSSProperties}>
                Response within 24–48h
              </p>
            </div>
          </div>

          {/* Legal row */}
          <div
            className="pt-6 pb-10 md:pb-14 px-6"
            style={{ borderTop: "1px solid hsl(0 0% 100% / 0.05)" }}
          >
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
              <span
                className="text-[11px] tracking-tight"
                style={{ color: "hsl(0 0% 36%)", fontFamily: "'IBM Plex Mono', monospace" }}
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
                    {i > 0 && <span style={{ color: "hsl(0 0% 22%)" }}>·</span>}
                    <Link
                      to={link.to}
                      className="text-[10px] tracking-wide transition-colors"
                      style={{ color: "hsl(0 0% 42%)" }}
                    >
                      {link.label}
                    </Link>
                  </span>
                ))}
                <span style={{ color: "hsl(0 0% 22%)" }}>·</span>
                <a
                  href="mailto:hello@secondears.io"
                  className="text-[10px] tracking-wide transition-colors"
                  style={{ color: "hsl(0 0% 42%)" }}
                >
                  Contact
                </a>
              </div>
              <p className="text-[10px] tracking-wide" style={{ color: "hsl(0 0% 32%)" }}>
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

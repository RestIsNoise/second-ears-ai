import { Button } from "@/components/ui/button";
import { Upload, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Modes", href: "/#modes" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "mailto:hello@secondears.io", external: true },
];

const UnifiedFooter = () => {
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal();
  const { ref: footerRef, isVisible: footerVisible } = useScrollReveal();

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
          background: "linear-gradient(to bottom, hsl(var(--surface-c)) 0%, hsl(0 0% 12%) 35%, hsl(0 0% 9%) 70%, hsl(0 0% 6.7%) 100%)",
        }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(to bottom, hsl(var(--border-subtle) / 0.2), hsl(0 0% 100% / 0.03), transparent)" }}
        />
        <div
          className="absolute top-1/2 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 10%, hsl(0 0% 100% / 0.04) 30%, hsl(0 0% 100% / 0.04) 70%, transparent 90%)" }}
        />
      </div>

      {/* ── Dark footer ── */}
      <section
        ref={footerRef}
        className={`relative overflow-hidden reveal ${footerVisible ? "is-visible" : ""}`}
        style={{ background: "#111" }}
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

        <div className="relative" style={{ padding: "60px 48px 40px" }}>
          {/* Three-column grid */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {/* Left — Brand */}
            <div>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  color: "#fff",
                  textTransform: "uppercase" as const,
                }}
              >
                SecondEar
              </p>
              <p style={{ fontSize: 13, color: "#666", marginTop: 8, lineHeight: 1.6 }}>
                AI mix feedback for producers.
              </p>
            </div>

            {/* Center — Nav links */}
            <div className="flex flex-col items-start md:items-center">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="transition-colors"
                    style={{ fontSize: 13, color: "#555", lineHeight: 2 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="transition-colors"
                    style={{ fontSize: 13, color: "#555", lineHeight: 2 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>

            {/* Right — Contact */}
            <div className="flex flex-col items-start md:items-end gap-3">
              <Button variant="hero" size="lg" className="h-11 px-8 text-[12px] gap-2" asChild>
                <a href="mailto:hello@secondears.io">
                  <Mail className="w-4 h-4" />
                  hello@secondears.io
                </a>
              </Button>
              <p style={{ fontSize: 11, color: "#555" }}>
                Response within 24–48h
              </p>
              <p style={{ fontSize: 12, color: "#555" }}>
                Instagram:{" "}
                <a
                  href="https://instagram.com/secondear.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
                >
                  @secondear.app
                </a>
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: "1px solid #222", paddingTop: 24, marginTop: 40 }}
          >
            <p style={{ fontSize: 11, color: "#444" }}>
              © {new Date().getFullYear()} SecondEar. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <p style={{ fontSize: 11, color: "#444" }}>
                Private by default · Not used to train AI
              </p>
              <span style={{ color: "#333" }}>·</span>
              <Link to="/privacy" className="transition-colors" style={{ fontSize: 11, color: "#444" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; }}
              >
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors" style={{ fontSize: 11, color: "#444" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; }}
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
};

export default UnifiedFooter;

import { Button } from "@/components/ui/button";
import { Upload, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const UnifiedFooter = () => (
  <footer>
    {/* ── Minimal CTA block ── */}
    <section className="bg-background py-10 md:py-12 px-6">
      <div className="max-w-xl mx-auto text-center">
        <Button variant="hero" size="lg" className="h-12 px-10 text-[13px] gap-2" asChild>
          <Link to="/analyze">
            <Upload className="w-4 h-4" />
            Start free analysis
          </Link>
        </Button>
        <p className="mt-4 text-[11px] tracking-wide text-muted-foreground/50">
          No credit card required
        </p>
      </div>
    </section>

    {/* ── Dark Contact + Legal area ── */}
    <section
      className="relative overflow-hidden"
      style={{ background: "hsl(0 0% 5%)" }}
    >
      {/* Narrow, subtle top fade */}
      <div
        className="absolute top-0 left-0 right-0 h-10 pointer-events-none"
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
        {/* Contact — extra top padding to clear gradient */}
        <div className="pt-20 md:pt-24 pb-10 md:pb-12 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <p
              className="font-mono-brand text-xs tracking-widest uppercase mb-3"
              style={{ color: "hsl(0 0% 52%)" }}
            >
              Get in touch
            </p>
            <h2
              className="text-2xl md:text-3xl font-semibold tracking-tight mb-2"
              style={{ color: "hsl(0 0% 93%)" }}
            >
              Contact
            </h2>
            <p
              className="text-sm max-w-sm mx-auto mb-6 leading-relaxed"
              style={{ color: "hsl(0 0% 58%)" }}
            >
              Billing, feedback quality, feature requests. We read every message.
            </p>
            <Button variant="hero" size="lg" className="h-11 px-8 text-[13px] gap-2" asChild>
              <a href="mailto:hello@secondears.io">
                <Mail className="w-4 h-4" />
                hello@secondears.io
              </a>
            </Button>
            <p className="text-[11px] mt-3" style={{ color: "hsl(0 0% 44%)" }}>
              Response within 24–48h
            </p>
          </div>
        </div>

        {/* Legal row */}
        <div className="pt-6 pb-10 md:pb-14 px-6 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-5">
            <span
              className="font-mono-brand text-xs tracking-tight"
              style={{ color: "hsl(0 0% 38%)" }}
            >
              SecondEars™
            </span>
            <div className="flex items-center gap-4">
              {[
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms of Service" },
                { to: "/faq", label: "FAQ" },
              ].map((link, i) => (
                <span key={link.to} className="flex items-center gap-4">
                  {i > 0 && <span style={{ color: "hsl(0 0% 24%)" }}>·</span>}
                  <Link
                    to={link.to}
                    className="text-[10px] tracking-wide transition-colors"
                    style={{ color: "hsl(0 0% 44%)" }}
                  >
                    {link.label}
                  </Link>
                </span>
              ))}
              <span style={{ color: "hsl(0 0% 24%)" }}>·</span>
              <a
                href="mailto:hello@secondears.io"
                className="text-[10px] tracking-wide transition-colors"
                style={{ color: "hsl(0 0% 44%)" }}
              >
                Contact
              </a>
            </div>
            <p className="text-[10px] tracking-wide" style={{ color: "hsl(0 0% 32%)" }}>
              © {new Date().getFullYear()} SecondEars. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>
  </footer>
);

export default UnifiedFooter;

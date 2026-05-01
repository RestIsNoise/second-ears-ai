import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/hooks/useScrollReveal";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeaders, BACKEND } from "@/lib/backendFetch";
import HeroVisual from "@/components/HeroVisual";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const GoogleG = () => (
  <span
    className="inline-flex items-center justify-center rounded-full bg-white"
    style={{ width: 18, height: 18 }}
    aria-hidden="true"
  >
    <svg width="11" height="11" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  </span>
);

const Hero = () => {
  const { ref: parallaxRef, progress } = useScrollProgress<HTMLElement>();
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!user) { setIsPro(false); return; }
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND}/api/usage`, { headers });
        if (res.ok) {
          const data = await res.json();
          setIsPro(data.plan === "pro");
        }
      } catch { /* default free */ }
    })();
  }, [user]);

  // Subtle parallax: headline moves up slightly, screenshot scales in
  const headlineY = progress * -18;

  return (
    <section
      ref={parallaxRef}
      className="relative overflow-hidden"
      style={{ background: "hsl(0 0% 4%)", color: "hsl(0 0% 94%)" }}
    >
      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "512px 512px",
        }}
      />

      {/* Ambient halo — shifts with scroll */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/3 right-[15%] w-[500px] h-[500px] rounded-full blur-[140px] transition-opacity duration-700"
          style={{ background: `hsl(0 0% 18% / 0.35)` }}
        />
        <div
          className="absolute top-[60%] left-[20%] w-[300px] h-[300px] rounded-full blur-[120px]"
          style={{ background: "hsl(0 0% 14% / 0.25)" }}
        />
      </div>


      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-32 md:pb-24 lg:pt-32 lg:pb-20">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-12 items-center">
          {/* Left column — Copy with parallax */}
           <div
            className="max-w-xl"
            style={{ opacity: 0, transform: `translateY(${headlineY}px)`, animation: "slideInLeft 0.7s ease forwards" }}
           >
            <p
              className="text-[10px] font-medium tracking-[0.25em] uppercase mb-5 animate-fade-up label-pulse"
              style={{ color: "hsl(0 0% 55%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              AI speed · Human ears
            </p>

            <h1
              className="text-[2.1rem] sm:text-[2.7rem] md:text-[3.1rem] lg:text-[3.4rem] font-semibold tracking-tight leading-[1.05] mb-5 animate-fade-up"
              style={{ animationDelay: "0.08s" }}
            >
              <span className="block">Actionable</span>
              <span className="block">mix feedback</span>
              <span className="block font-light" style={{ color: "hsl(0 0% 78%)" }}>
                in under 2 minutes.
              </span>
            </h1>

            <p
              className="text-[13px] sm:text-[14px] leading-relaxed font-light mb-7 max-w-lg animate-fade-up"
              style={{ color: "hsl(0 0% 94% / 0.7)", animationDelay: "0.16s" }}
            >
              AI analyzes your mix, then gives you timestamped issues, technical metrics, and a prioritized fix plan you can share with collaborators.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-up"
              style={{ animationDelay: "0.24s" }}
            >
              <Button
                variant="hero"
                size="lg"
                className="h-12 px-7 text-[13px] gap-2.5 w-full sm:w-auto cta-hover"
                asChild
              >
                <Link to="/analyze">
                  <GoogleG />
                  {isPro ? "Analyze a track" : "Get free feedback"}
                </Link>
              </Button>
            </div>

            {/* Inline trust row — single line monospace */}
            {!isPro && (
              <p
                className="text-[10.5px] tracking-[0.04em] animate-fade-up"
                style={{
                  color: "hsl(0 0% 94% / 0.5)",
                  fontFamily: MONO,
                  animationDelay: "0.32s",
                }}
              >
                No credit card required · Not used for AI training · Private by default
              </p>
            )}
          </div>

          {/* Right column — Static visual */}
          <div
            className="relative lg:justify-self-end mx-auto lg:mx-0 w-full max-w-[640px]"
            style={{ opacity: 0, animation: "slideInRight 0.7s ease 0.2s forwards" }}
          >
            <HeroVisual />
          </div>
        </div>

        {/* Bottom trust strip */}
        <div
          className="relative mt-12 sm:mt-14 pt-6 border-t flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-fade-up"
          style={{
            borderColor: "hsl(0 0% 100% / 0.06)",
            color: "hsl(0 0% 94% / 0.6)",
            fontFamily: MONO,
            animationDelay: "0.4s",
          }}
        >
          <span className="flex items-center gap-2 text-[11px] tracking-wide whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 94% / 0.5)" }} />
            Thousands of tracks analyzed
          </span>
          <span className="flex items-center gap-2 text-[11px] tracking-wide whitespace-nowrap">
            <Shield className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 94% / 0.5)" }} />
            Your music never used for AI training
          </span>
          <span className="flex items-center gap-2 text-[11px] tracking-wide whitespace-nowrap">
            <Zap className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 94% / 0.5)" }} />
            Free to start — no credit card
          </span>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(var(--background)))",
        }}
      />
    </section>
  );
};

export default Hero;

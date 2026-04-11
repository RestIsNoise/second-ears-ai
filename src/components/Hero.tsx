import { Button } from "@/components/ui/button";
import { Upload, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/hooks/useScrollReveal";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeaders, BACKEND } from "@/lib/backendFetch";
import HeroVisual from "@/components/HeroVisual";

const trustItems = [
  "No card required",
  "Not used for AI training",
  "Private by default",
];

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
      className="relative overflow-hidden lg:min-h-[600px]"
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


      <div className="relative max-w-7xl mx-auto px-6 pt-36 pb-36 sm:pt-48 sm:pb-48 md:pt-56 md:pb-56 lg:pt-60 lg:pb-56">
        <div className="grid lg:grid-cols-[0.8fr_1.4fr] gap-8 lg:gap-12 items-end">
          {/* Left column — Copy with parallax */}
           <div
            className="max-w-xl"
            style={{ opacity: 0, transform: `translateY(${headlineY}px)`, animation: "slideInLeft 0.7s ease forwards" }}
           >
            <p
              className="text-[10px] font-medium tracking-[0.25em] uppercase mb-6 sm:mb-8 animate-fade-up label-pulse"
              style={{ color: "hsl(0 0% 55%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              AI speed · Human ears
            </p>

            <h1
              className="text-[2rem] sm:text-[2.6rem] md:text-[3.2rem] lg:text-[3.75rem] font-semibold tracking-tight leading-[1.08] mb-5 sm:mb-6 animate-fade-up"
              style={{ animationDelay: "0.08s" }}
            >
              Actionable mix
              <br className="hidden sm:block" />
              {" "}feedback in minutes.
            </h1>

            <p
              className="text-[13px] sm:text-[14px] leading-relaxed font-light mb-8 sm:mb-10 max-w-md animate-fade-up"
              style={{ color: "hsl(0 0% 60%)", animationDelay: "0.16s" }}
            >
              From upload to a prioritized fix plan, instantly.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 mb-7 sm:mb-8 animate-fade-up"
              style={{ animationDelay: "0.24s" }}
            >
              <Button
                variant="hero"
                size="lg"
                className="h-12 px-10 text-[13px] gap-2 w-full sm:w-auto cta-hover"
                asChild
              >
                <Link to="/analyze">
                  <Upload className="w-4 h-4" />
                  {isPro ? "Analyze a track" : "Start free analysis"}
                </Link>
              </Button>
              <Button
                size="lg"
                className="h-11 px-8 text-[13px] rounded-full font-medium tracking-tight transition-all duration-200 border bg-transparent hover:bg-white/5 w-full sm:w-auto"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.15)",
                  color: "hsl(0 0% 80%)",
                }}
                onClick={() =>
                  document
                    .getElementById("demo-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                See live demo
              </Button>
            </div>

            {/* Trust row — hidden for Pro users */}
            {!isPro && (
            <div
              className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 animate-fade-up"
              style={{ animationDelay: "0.32s" }}
            >
              {trustItems.map((item, i) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-[11px] tracking-wide whitespace-nowrap"
                  style={{ color: "hsl(0 0% 42%)" }}
                >
                  {i > 0 && (
                    <span
                      className="w-px h-3 shrink-0"
                      style={{ background: "hsl(0 0% 24%)" }}
                    />
                  )}
                  {item}
                </span>
              ))}
            </div>
            )}
          </div>

          {/* Right column — Static visual */}
          <div
            className="relative lg:justify-self-end mx-auto lg:mx-0 w-full max-w-[520px]"
            style={{ opacity: 0, animation: "slideInRight 0.7s ease 0.2s forwards" }}
          >
            <HeroVisual />
          </div>
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

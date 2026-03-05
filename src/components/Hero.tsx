import { Button } from "@/components/ui/button";
import { Upload, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import heroScreenshot from "@/assets/hero-screenshot.png";

const trustItems = [
  "No credit card",
  "Not used for AI training",
  "Private by default",
];

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const els = sectionRef.current.querySelectorAll<HTMLElement>("[data-parallax]");
      const y = window.scrollY;
      els.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0");
        el.style.transform = `translateY(${y * speed}px)`;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
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

      {/* Ambient halo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          data-parallax="-0.02"
          className="absolute top-1/3 right-[15%] w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "hsl(0 0% 18% / 0.35)" }}
        />
        <div
          data-parallax="-0.03"
          className="absolute top-[60%] left-[20%] w-[300px] h-[300px] rounded-full blur-[120px]"
          style={{ background: "hsl(0 0% 14% / 0.25)" }}
        />
      </div>

      {/* Diagonal bar motif */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          data-parallax="-0.03"
          className="absolute -top-[20%] left-[72%] w-[1px] h-[160%] rotate-[70deg] origin-center"
          style={{ background: "hsl(0 0% 100% / 0.06)" }}
        />
        <div
          data-parallax="-0.04"
          className="absolute -top-[20%] left-[78%] w-[1px] h-[160%] rotate-[70deg] origin-center"
          style={{ background: "hsl(0 0% 100% / 0.06)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-40 md:pb-32">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left column — Copy */}
          <div className="max-w-xl">
            <p
              className="font-mono-brand text-[11px] font-medium tracking-[0.4em] uppercase mb-6 sm:mb-8 animate-fade-up"
              style={{ color: "hsl(0 0% 55%)" }}
            >
              AI speed · Human ears
            </p>

            <h1
              className="text-[1.75rem] sm:text-4xl md:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.12] mb-5 sm:mb-6 animate-fade-up"
              style={{ animationDelay: "0.08s" }}
            >
              Actionable mix
              <br className="hidden sm:block" />
              {" "}feedback in minutes.
            </h1>

            <p
              className="text-[14px] sm:text-[15px] leading-relaxed font-light mb-8 sm:mb-10 max-w-md animate-fade-up"
              style={{ color: "hsl(0 0% 58%)", animationDelay: "0.16s" }}
            >
              From upload to a prioritized fix plan in minutes.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 mb-7 sm:mb-8 animate-fade-up"
              style={{ animationDelay: "0.24s" }}
            >
              <Button
                variant="hero"
                size="lg"
                className="h-12 px-10 text-[13px] gap-2 w-full sm:w-auto"
                asChild
              >
                <Link to="/analyze">
                  <Upload className="w-4 h-4" />
                  Start free analysis
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
                    .getElementById("demo")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                See live demo
              </Button>
            </div>

            {/* Trust row */}
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
          </div>

          {/* Right column — Real product screenshot */}
          <div
            className="relative animate-fade-up lg:justify-self-end mx-auto lg:mx-0"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Glow behind frame */}
            <div
              className="absolute -inset-8 sm:-inset-10 rounded-3xl blur-[100px] pointer-events-none"
              aria-hidden="true"
              style={{ background: "hsl(0 0% 16% / 0.4)" }}
            />

            {/* Screenshot frame with float animation */}
            <div
              className="relative w-full max-w-[360px] sm:max-w-[480px] rounded-xl border overflow-hidden shadow-2xl"
              style={{
                borderColor: "hsl(0 0% 100% / 0.08)",
                animation: "hero-float 6s ease-in-out infinite",
              }}
            >
              {/* Window dots bar */}
              <div
                className="flex items-center gap-1.5 px-4 py-2.5 border-b"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(0 0% 7%)",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
              </div>

              {/* Screenshot */}
              <img
                src={heroScreenshot}
                alt="SecondEars analysis showing technical metrics, timeline feedback, and to-do list for a music track"
                className="w-full h-auto block"
                loading="eager"
              />
            </div>

            {/* Label chip */}
            <div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-medium tracking-wide border backdrop-blur-sm"
              style={{
                borderColor: "hsl(0 0% 100% / 0.1)",
                background: "hsl(0 0% 8% / 0.85)",
                color: "hsl(0 0% 60%)",
                boxShadow: "0 4px 20px hsl(0 0% 0% / 0.4)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(140 50% 45%)" }} />
              Real feedback example
            </div>
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

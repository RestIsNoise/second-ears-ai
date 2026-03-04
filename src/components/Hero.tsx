import { Button } from "@/components/ui/button";
import { Upload, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

const floatingChips = [
  { label: "Timeline feedback", top: "12%", right: "-4%" },
  { label: "To‑Do list", top: "48%", right: "-8%" },
  { label: "Sub/Kick ratio", top: "78%", right: "2%" },
];

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

      {/* Ambient halo behind product frame */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          data-parallax="-0.02"
          className="absolute top-1/3 right-[15%] w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "hsl(0 0% 22% / 0.45)" }}
        />
        <div
          data-parallax="-0.03"
          className="absolute top-[60%] left-[20%] w-[300px] h-[300px] rounded-full blur-[120px]"
          style={{ background: "hsl(0 0% 16% / 0.3)" }}
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
              Three listening modes. Timestamped issues. A to-do list to work through.
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

          {/* Right column — Product frame */}
          <div
            className="relative animate-fade-up lg:justify-self-end mx-auto lg:mx-0"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Glow behind frame */}
            <div
              className="absolute -inset-6 sm:-inset-8 rounded-3xl blur-[80px] pointer-events-none"
              aria-hidden="true"
              style={{ background: "hsl(0 0% 18% / 0.5)" }}
            />

            {/* Mock product frame */}
            <div
              className="relative w-full max-w-[360px] sm:max-w-[480px] aspect-[4/3] rounded-xl border overflow-hidden"
              style={{
                borderColor: "hsl(0 0% 100% / 0.08)",
                background: "hsl(0 0% 7%)",
              }}
            >
              {/* Fake window dots */}
              <div
                className="flex items-center gap-1.5 px-4 py-3 border-b"
                style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "hsl(0 0% 25%)" }}
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "hsl(0 0% 25%)" }}
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "hsl(0 0% 25%)" }}
                />
              </div>

              {/* Skeleton content */}
              <div className="p-5 space-y-4">
                {/* Fake waveform bars */}
                <div className="flex items-end gap-[3px] h-12">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const h = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 12;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          background: `hsl(0 0% ${28 + Math.random() * 12}%)`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Fake metric rows */}
                <div className="grid grid-cols-3 gap-3">
                  {["LUFS", "Peak", "DR"].map((label) => (
                    <div
                      key={label}
                      className="rounded-lg p-3 space-y-2"
                      style={{ background: "hsl(0 0% 10%)" }}
                    >
                      <div
                        className="text-[9px] font-mono-brand tracking-wider uppercase"
                        style={{ color: "hsl(0 0% 40%)" }}
                      >
                        {label}
                      </div>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ background: "hsl(0 0% 20%)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${50 + Math.random() * 40}%`,
                            background: "hsl(0 0% 35%)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fake timeline cards */}
                <div className="space-y-2">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="flex items-center gap-3 rounded-lg p-2.5"
                      style={{ background: "hsl(0 0% 10%)" }}
                    >
                      <div
                        className="w-8 h-8 rounded shrink-0"
                        style={{ background: "hsl(0 0% 18%)" }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${55 + n * 15}%`,
                            background: "hsl(0 0% 22%)",
                          }}
                        />
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${35 + n * 10}%`,
                            background: "hsl(0 0% 16%)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating chips */}
            {floatingChips.map((chip) => (
              <div
                key={chip.label}
                className="absolute hidden md:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-medium tracking-wide border backdrop-blur-sm"
                style={{
                  top: chip.top,
                  right: chip.right,
                  borderColor: "hsl(0 0% 100% / 0.1)",
                  background: "hsl(0 0% 8% / 0.8)",
                  color: "hsl(0 0% 65%)",
                  boxShadow: "0 4px 20px hsl(0 0% 0% / 0.4)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "hsl(0 0% 45%)" }}
                />
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade into light bg */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, hsl(var(--background)))",
        }}
      />
    </section>
  );
};

export default Hero;

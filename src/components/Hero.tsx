import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

const Hero = () => {
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!barsRef.current) return;
      const y = window.scrollY;
      const bars = barsRef.current.children;
      for (let i = 0; i < bars.length; i++) {
        const el = bars[i] as HTMLElement;
        const speed = parseFloat(el.dataset.speed || "0");
        el.style.transform = `rotate(65deg) translateY(${y * speed}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative pt-56 pb-48 px-6 overflow-hidden">
      {/* Diagonal bars — "//" motif */}
      <div ref={barsRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          data-speed="-0.03"
          className="absolute -top-[20%] left-[55%] w-[1.5px] h-[160%] bg-foreground/25 rotate-[70deg] origin-center"
        />
        <div
          data-speed="-0.04"
          className="absolute -top-[20%] left-[62%] w-[1.5px] h-[160%] bg-foreground/25 rotate-[70deg] origin-center"
        />
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-foreground/[0.015] blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto text-center">
        <p className="font-mono-brand text-[11px] font-medium text-muted-foreground tracking-[0.4em] uppercase mb-12 animate-fade-up">
          AI speed · Human ears
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08] mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Hear your mix<br />differently.
        </h1>
        <p className="text-[14px] text-muted-foreground/70 max-w-xs mx-auto mb-16 leading-relaxed font-light animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Precise, actionable feedback — delivered in minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Button variant="hero" size="lg" className="h-12 px-10 text-[13px] gap-2" asChild>
            <Link to="/analyze">
              <Upload className="w-4 h-4" />
              Upload your track
            </Link>
          </Button>
          <Button variant="hero-outline" size="lg" className="h-11 px-8 text-[13px]">
            See how it works
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;

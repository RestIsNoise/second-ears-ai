import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

const Hero = () => {
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!artRef.current) return;
      const y = window.scrollY;
      const shapes = artRef.current.children;
      for (let i = 0; i < shapes.length; i++) {
        const el = shapes[i] as HTMLElement;
        const speed = parseFloat(el.dataset.speed || "0");
        el.style.transform = `translateY(${y * speed}px) rotate(${y * speed * 0.3}deg)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative pt-56 pb-48 px-6 overflow-hidden">
      {/* Geometric artwork */}
      <div ref={artRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Large thin ring — top right */}
        <div
          data-speed="-0.04"
          className="absolute -top-20 -right-32 w-[500px] h-[500px] rounded-full border border-foreground/[0.06]"
        />
        {/* Small circle — left */}
        <div
          data-speed="0.06"
          className="absolute top-1/2 -left-8 w-20 h-20 rounded-full border border-foreground/[0.08]"
        />
        {/* Diagonal line — right */}
        <div
          data-speed="-0.03"
          className="absolute top-1/3 right-[15%] w-px h-40 bg-foreground/[0.06] rotate-[30deg] origin-top"
        />
        {/* Small square — bottom left */}
        <div
          data-speed="0.05"
          className="absolute bottom-24 left-[18%] w-8 h-8 border border-foreground/[0.07] rotate-45"
        />
        {/* Thin horizontal rule — top left */}
        <div
          data-speed="-0.02"
          className="absolute top-[30%] left-[10%] w-24 h-px bg-foreground/[0.05]"
        />
        {/* Medium ring — bottom right */}
        <div
          data-speed="0.04"
          className="absolute -bottom-16 right-[12%] w-60 h-60 rounded-full border border-foreground/[0.05]"
        />
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-foreground/[0.015] blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto text-center">
        <p className="font-mono-brand text-[10px] text-muted-foreground/60 tracking-[0.4em] uppercase mb-12 animate-fade-up">
          AI speed · Human ears
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08] mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Hear your mix<br />differently.
        </h1>
        <p className="text-[14px] text-muted-foreground/70 max-w-xs mx-auto mb-16 leading-relaxed font-light animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Precise, actionable feedback — delivered in minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Button variant="hero" size="lg" className="h-11 px-8 text-[13px] gap-2" asChild>
            <Link to="/analyze">
              <Upload className="w-4 h-4" />
              Upload your track
            </Link>
          </Button>
          <Button variant="hero-outline" size="lg" className="h-12 px-8 text-sm">
            See how it works
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;

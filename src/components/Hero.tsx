import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => (
  <section className="relative pt-56 pb-48 px-6 overflow-hidden">
    {/* Ambient organic glow */}
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-foreground/[0.015] blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[400px] rounded-full bg-foreground/[0.01] blur-[100px]" />
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

export default Hero;

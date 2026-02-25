import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => (
  <section className="pt-48 pb-40 px-6">
    <div className="max-w-2xl mx-auto text-center">
      <p className="font-mono-brand text-[11px] text-muted-foreground/50 tracking-[0.25em] uppercase mb-8 animate-fade-up">
        Mix feedback, reimagined
      </p>
      <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        AI speed.<br />Human ears.
      </h1>
      <p className="text-[15px] md:text-base text-muted-foreground/70 max-w-sm mx-auto mb-14 leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
        Hear your mix differently. Precise, actionable feedback — delivered in minutes.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <Button variant="hero" size="lg" className="h-12 px-8 text-sm gap-2" asChild>
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

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => (
  <section className="pt-40 pb-32 px-6">
    <div className="max-w-3xl mx-auto text-center">
      <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-6 animate-fade-up">
        Mix feedback, reimagined
      </p>
      <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        AI speed.<br />Human ears.
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        Stop guessing your mix. Get instant, actionable feedback on your music — from AI that listens like a pro.
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

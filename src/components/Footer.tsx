import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="py-24 md:py-32 px-6 border-t border-border-subtle">
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-center gap-12 md:gap-20 mb-20">
        {["Dream", "Learn", "Create", "Evolve"].map((word) => (
          <span
            key={word}
            className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground/60 font-light"
          >
            {word}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6">
        <span className="font-mono-brand text-xs tracking-tight text-foreground/40">
          SecondEars™
        </span>
        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="text-[10px] text-muted-foreground/40 tracking-wide hover:text-muted-foreground/60 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/20">·</span>
          <a
            href="mailto:hello@secondears.io"
            className="text-[10px] text-muted-foreground/40 tracking-wide hover:text-muted-foreground/60 transition-colors"
          >
            Contact
          </a>
        </div>
        <p className="text-[10px] text-muted-foreground/30 tracking-wide">
          © {new Date().getFullYear()} SecondEars. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

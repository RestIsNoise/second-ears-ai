import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="py-10 md:py-14 px-6 border-t border-border-subtle">
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col items-center gap-5">
        <span className="font-mono-brand text-xs tracking-tight text-foreground/40">
          SecondEar™
        </span>
        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/20">·</span>
          <Link
            to="/terms"
            className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <span className="text-muted-foreground/20">·</span>
          <Link
            to="/faq"
            className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
          >
            FAQ
          </Link>
          <span className="text-muted-foreground/20">·</span>
          <Link
            to="/changelog"
            className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
          >
            Changelog
          </Link>
          <span className="text-muted-foreground/20">·</span>
          <a
            href="mailto:hello@secondears.io"
            className="text-[10px] text-muted-foreground/50 tracking-wide hover:text-muted-foreground transition-colors"
          >
            Contact
          </a>
        </div>
        <p className="text-[10px] text-muted-foreground/30 tracking-wide">
          © {new Date().getFullYear()} SecondEar. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

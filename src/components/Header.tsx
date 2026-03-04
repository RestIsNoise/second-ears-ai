import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "Modes", href: "/#modes" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-[6px] border-b border-border-subtle">
    <div className="flex items-center justify-between h-14 max-w-5xl mx-auto px-6">
      <Link to="/" className="flex items-center gap-2">
        <span className="font-mono-brand text-sm font-medium tracking-tight">SecondEars</span>
      </Link>
      <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
        {navItems.map((item) => (
          <a key={item.label} href={item.href} className="hover:text-foreground transition-colors">
            {item.label}
          </a>
        ))}
      </nav>
      <Button variant="hero" size="sm" className="text-xs h-8 px-4" asChild>
        <Link to="/analyze">Start free</Link>
      </Button>
    </div>
  </header>
);

export default Header;

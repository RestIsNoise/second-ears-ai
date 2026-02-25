import { Button } from "@/components/ui/button";

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border-subtle">
    <div className="container flex items-center justify-between h-16 max-w-6xl mx-auto px-6">
      <div className="flex items-center gap-2">
        <span className="font-mono-brand text-sm font-medium tracking-tight">SecondEars</span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="#modes" className="hover:text-foreground transition-colors">Modes</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
      </nav>
      <Button variant="hero" size="sm" className="text-xs h-8 px-4">
        Get started
      </Button>
    </div>
  </header>
);

export default Header;

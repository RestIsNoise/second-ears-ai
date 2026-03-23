import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "Modes", href: "/#modes" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/faq" },
];

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = (profile?.display_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        scrolled
          ? "h-10 shadow-[0_2px_8px_-2px_hsl(0_0%_0%/0.15)]"
          : "h-12"
      )}
      style={{
        background: scrolled ? "rgba(255,255,255,0.92)" : "hsl(var(--background) / 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "2px solid hsl(var(--foreground) / 0.08)",
        transition: "background 0.2s ease, height 0.3s ease, border-bottom 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div className={cn(
        "flex items-center justify-between max-w-5xl mx-auto px-6 transition-all duration-300",
        scrolled ? "h-10" : "h-12"
      )}>
        <Link to="/" className="flex items-center gap-2">
          <span
            className={cn(
              "font-bold tracking-tight transition-all duration-300 uppercase",
              scrolled ? "text-[13px]" : "text-[14px]"
            )}
            style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em" }}
          >
            SecondEar
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className={cn(
          "hidden md:flex items-center transition-all duration-300",
          scrolled ? "gap-5 text-[10px]" : "gap-6 text-[11px]"
        )}
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}
        >
          {navItems.map((item) =>
            item.href.startsWith("/") && !item.href.startsWith("/#") ? (
              <Link key={item.label} to={item.href} className="text-foreground/40 hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="text-foreground/40 hover:text-foreground transition-colors">
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="flex items-center gap-2.5">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar
                    className={cn("transition-all duration-500", scrolled ? "h-7 w-7" : "h-8 w-8")}
                    style={{ border: "1px solid #e0e0e0" }}
                  >
                    {(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) && (
                      <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt="Avatar" />
                    )}
                    <AvatarFallback
                      style={{ background: "#111", color: "#fff", fontSize: 13, fontWeight: 600 }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e8e8e8",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  minWidth: 160,
                }}
              >
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              className={cn("text-[10px] px-4 transition-all duration-300 uppercase tracking-[0.06em] font-bold", scrolled ? "h-7" : "h-7")}
              style={{ borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace" }}
              asChild
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <button
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border-subtle/40 bg-background/98 backdrop-blur-sm px-6 py-4 space-y-3">
          {navItems.map((item) =>
            item.href.startsWith("/") && !item.href.startsWith("/#") ? (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className="block text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors py-1"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors py-1"
              >
                {item.label}
              </a>
            )
          )}
        </div>
      )}
    </header>
  );
};

export default Header;

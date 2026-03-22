import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, BACKEND } from "@/lib/backendFetch";
import { toast } from "@/hooks/use-toast";

const plans: {
  name: string; price: string; period: string; description: string;
  features: { text: string; included: boolean }[];
  cta: string; featured: boolean; comingSoon?: boolean;
}[] = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    description: "First tracks free.",
    features: [
      { text: "3 tracks / month", included: true },
      { text: "Technical mode only", included: true },
      { text: "Basic frequency analysis", included: true },
      { text: "24h cooldown between uploads", included: true },
      { text: "All listening modes", included: false },
      { text: "PDF export", included: false },
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/ month",
    description: "Unlimited tracks, all modes.",
    features: [
      { text: "Unlimited tracks", included: true },
      { text: "All 3 listening modes", included: true },
      { text: "Full detailed reports", included: true },
      { text: "Priority processing", included: true },
      { text: "PDF export", included: true },
    ],
    cta: "Start Pro",
    featured: true,
  },
  {
    name: "Human Review",
    price: "—",
    period: "",
    description: "Expert feedback from real engineers.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Feedback from a mixing engineer", included: true },
      { text: "Personalized notes & suggestions", included: true },
      { text: "48h turnaround", included: true },
    ],
    cta: "",
    featured: false,
    comingSoon: true,
  },
];

const Pricing = () => {
  const { ref, isVisible } = useScrollReveal();
  const navigate = useNavigate();
  const [proLoading, setProLoading] = useState(false);

  const handleStartPro = async () => {
    setProLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers["Authorization"]) {
        navigate("/auth");
        return;
      }
      const res = await fetch(`${BACKEND}/api/stripe/checkout`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Checkout failed (${res.status})`);
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Error starting checkout", description: err.message, variant: "destructive" });
      setProLoading(false);
    }
  };

  return (
    <section
      ref={ref}
      id="pricing"
      className={`relative py-16 md:py-22 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-a))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-[680px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-14 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-1 h-1 rounded-full" style={{ background: "hsl(var(--foreground) / 0.12)" }} />
            <p
              className="text-[10px] text-muted-foreground/40 tracking-[0.2em] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Simple pricing
            </p>
            <span className="w-1 h-1 rounded-full" style={{ background: "hsl(var(--foreground) / 0.12)" }} />
          </div>
          <h2 className="text-[1.4rem] md:text-[1.6rem] font-semibold tracking-[-0.035em]">Pick your plan</h2>
          <p className="text-[12.5px] text-muted-foreground/50 mt-2 max-w-xs mx-auto leading-relaxed">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-stretch max-w-[720px] mx-auto">
          {plans.map((plan, i) => {
            const staggerOrder = plan.featured ? 2 : i === 0 ? 0 : i;
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-lg flex flex-col overflow-hidden reveal-child",
                  plan.featured && isVisible && "pro-emphasis"
                )}
                style={{
                  "--stagger": `${100 + staggerOrder * 130}ms`,
                  background: plan.featured ? "hsl(0 0% 6%)" : "hsl(var(--card))",
                  color: plan.featured ? "hsl(0 0% 92%)" : undefined,
                  border: plan.comingSoon
                    ? "1px solid hsl(var(--border-subtle) / 0.3)"
                    : plan.featured
                      ? "1px solid hsl(0 0% 14%)"
                      : "1px solid hsl(var(--border-subtle) / 0.45)",
                  boxShadow: plan.featured
                    ? "0 16px 48px -12px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.04)"
                    : "0 1px 4px hsl(0 0% 0% / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
                  transform: plan.featured ? "scale(1.03)" : undefined,
                  zIndex: plan.featured ? 10 : undefined,
                  opacity: plan.comingSoon ? 0.55 : 1,
                } as React.CSSProperties}
              >
                {/* Badge */}
                {(plan.featured || plan.comingSoon) && (
                  <div
                    className="text-center py-1.5"
                    style={{
                      background: plan.comingSoon
                        ? "hsl(var(--foreground) / 0.04)"
                        : "hsl(0 0% 100% / 0.06)",
                      borderBottom: plan.comingSoon
                        ? "1px solid hsl(var(--border-subtle) / 0.15)"
                        : "1px solid hsl(0 0% 100% / 0.06)",
                    }}
                  >
                    <span
                      className="text-[9px] tracking-[0.14em] uppercase font-medium"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: plan.comingSoon
                          ? "hsl(var(--muted-foreground) / 0.5)"
                          : "hsl(0 0% 100% / 0.5)",
                      }}
                    >
                      {plan.comingSoon ? "Coming soon" : "Most popular"}
                    </span>
                  </div>
                )}

                {/* Price block */}
                <div className="px-5 pt-5 pb-4">
                  <p
                    className={cn(
                      "text-[10px] tracking-[0.12em] uppercase mb-3",
                      plan.featured ? "opacity-35" : "text-muted-foreground/40"
                    )}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1.5 select-none">
                    <span className="text-[2rem] font-semibold tracking-[-0.04em] leading-none">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className={cn(
                          "text-[11px]",
                          plan.featured ? "opacity-25" : "text-muted-foreground/30"
                        )}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[11.5px] mt-2 leading-relaxed",
                      plan.featured ? "opacity-40" : "text-muted-foreground/45"
                    )}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Divider */}
                <div
                  className="mx-5 h-px"
                  style={{
                    background: plan.featured
                      ? "hsl(0 0% 100% / 0.06)"
                      : "hsl(var(--border-subtle) / 0.25)",
                  }}
                />

                {/* Features */}
                <div className="px-5 py-4 flex-1">
                  <ul className="space-y-0">
                    {plan.features.map((feature, j) => (
                      <li
                        key={feature.text}
                        className="flex items-center gap-2.5 py-[6px]"
                        style={{
                          borderTop:
                            j > 0
                              ? `1px solid ${plan.featured ? "hsl(0 0% 100% / 0.04)" : "hsl(var(--border-subtle) / 0.12)"}`
                              : "none",
                        }}
                      >
                        <Check
                          className={cn(
                            "w-3 h-3 flex-shrink-0",
                            !feature.included && "opacity-0"
                          )}
                          style={{
                            color: plan.featured
                              ? "hsl(0 0% 100% / 0.3)"
                              : "hsl(var(--foreground) / 0.2)",
                          }}
                          strokeWidth={2}
                        />
                        <span
                          className={cn(
                            "text-[11.5px] leading-snug",
                            !feature.included &&
                              (plan.featured
                                ? "opacity-15 line-through"
                                : "text-muted-foreground/20 line-through"),
                            feature.included &&
                              !plan.featured &&
                              "text-foreground/55",
                            feature.included && plan.featured && "opacity-65"
                          )}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                {!plan.comingSoon && (
                  <div className="px-5 pb-5 mt-auto">
                    <Button
                      variant={plan.featured ? "default" : "outline"}
                      disabled={plan.featured && proLoading}
                      onClick={plan.featured ? handleStartPro : undefined}
                      className={cn(
                        "w-full h-10 text-[12px] font-medium tracking-[-0.01em] rounded-md",
                        plan.featured &&
                          "bg-white text-black hover:bg-white/90 border-0",
                        !plan.featured &&
                          "border-border-subtle/50 text-foreground/60 hover:text-foreground/80 hover:border-border-subtle"
                      )}
                    >
                      {plan.featured && proLoading ? "Redirecting…" : plan.cta}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "First tracks free.",
    features: [
      { text: "3 tracks / month", included: true },
      { text: "Technical mode only", included: true },
      { text: "Basic frequency analysis", included: true },
      { text: "48h cooldown between uploads", included: true },
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
      { text: "Human review", included: false },
    ],
    cta: "Start Pro",
    featured: true,
  },
  {
    name: "Human Review",
    price: "$19",
    period: "/ month",
    description: "Pro plus engineer feedback.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "3 human reviews / month", included: true },
      { text: "Human engineer review notes", included: true },
      { text: "Revision guidance", included: true },
    ],
    cta: "Start Human Review",
    featured: false,
  },
];

const Pricing = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      id="pricing"
      className={`relative py-16 md:py-22 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-a))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto">
        {/* Centered heading with flanking dots — distinct from other headings */}
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
            Start with three free tracks. Upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 items-start">
          {plans.map((plan, i) => {
            const staggerOrder = plan.featured ? 2 : i === 0 ? 0 : 1;
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-lg flex flex-col transition-all duration-200 reveal-child",
                  plan.featured && isVisible && "pro-emphasis"
                )}
                style={{
                  "--stagger": `${100 + staggerOrder * 130}ms`,
                  background: plan.featured ? "hsl(0 0% 7%)" : "hsl(var(--card))",
                  color: plan.featured ? "hsl(0 0% 92%)" : undefined,
                  border: plan.featured
                    ? "1px solid hsl(0 0% 16%)"
                    : "1px solid hsl(var(--border-subtle) / 0.45)",
                  boxShadow: plan.featured
                    ? "0 12px 40px -10px hsl(0 0% 0% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.04)"
                    : "0 1px 3px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
                  transform: plan.featured ? "scale(1.03)" : undefined,
                  zIndex: plan.featured ? 10 : undefined,
                } as React.CSSProperties}
              >
                {plan.featured && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.12em] uppercase px-3 py-1 rounded font-medium"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      background: "hsl(0 0% 92%)",
                      color: "hsl(0 0% 8%)",
                      border: "1px solid hsl(0 0% 80%)",
                      boxShadow: "0 2px 8px hsl(0 0% 0% / 0.12)",
                    }}
                  >
                    Most popular
                  </span>
                )}

                {/* Top accent strip for Pro */}
                {plan.featured && (
                  <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 30%), transparent)" }} />
                )}

                <div className="p-5 pb-4">
                  <h3 className="text-[13px] font-semibold tracking-[-0.02em]">{plan.name}</h3>
                  <p className={cn(
                    "text-[11px] mt-0.5",
                    plan.featured ? "opacity-40" : "text-muted-foreground/45"
                  )}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-[1.5rem] font-semibold tracking-[-0.03em] leading-none">{plan.price}</span>
                    <span className={cn(
                      "text-[11px]",
                      plan.featured ? "opacity-30" : "text-muted-foreground/35"
                    )}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <div
                  className="mx-5 h-px"
                  style={{ background: plan.featured ? "hsl(0 0% 100% / 0.06)" : "hsl(var(--border-subtle) / 0.25)" }}
                />

                <div className="p-5 pt-4 flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-2.5">
                        <Check className={cn(
                          "w-3.5 h-3.5 flex-shrink-0 mt-0.5",
                          !feature.included && "opacity-0",
                          plan.featured ? "opacity-30" : "text-muted-foreground/25"
                        )} />
                        <span className={cn(
                          "text-[11.5px] leading-snug",
                          !feature.included && (plan.featured ? "opacity-15 line-through" : "text-muted-foreground/20 line-through"),
                          feature.included && !plan.featured && "text-foreground/60",
                          feature.included && plan.featured && "opacity-70",
                        )}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-5 pb-5">
                  <Button
                    variant={plan.featured ? "hero-outline" : "hero"}
                    className={cn(
                      "w-full h-10 text-[12px] rounded-full",
                      plan.featured && "border-white/10 text-white hover:bg-white/6 bg-transparent"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

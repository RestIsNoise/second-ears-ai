import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

const Pricing = () => (
  <section id="pricing" className="py-16 md:py-20 px-6 border-t border-border-subtle/50">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p
          className="text-[10px] text-muted-foreground/60 tracking-[0.18em] uppercase mb-3"
          style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
        >
          Simple pricing
        </p>
        <h2 className="text-2xl md:text-[1.75rem] font-semibold tracking-tight">Pick your plan</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-4 items-start">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative rounded-lg border flex flex-col transition-all duration-200",
              plan.featured
                ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_20px_-4px_hsl(var(--foreground)/0.1)] md:scale-[1.03] z-10"
                : "bg-background border-border-subtle/50 hover:border-foreground/10"
            )}
          >
            {plan.featured && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.12em] uppercase bg-primary-foreground text-primary px-3 py-1 rounded-full font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Most popular
              </span>
            )}

            {/* Plan header */}
            <div className="p-5 pb-4">
              <h3 className="text-[15px] font-semibold tracking-tight">{plan.name}</h3>
              <p className={cn(
                "text-[12px] mt-0.5",
                plan.featured ? "text-primary-foreground/60" : "text-muted-foreground/60"
              )}>
                {plan.description}
              </p>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-[1.75rem] font-semibold tracking-tight leading-none">{plan.price}</span>
                <span className={cn(
                  "text-[12px]",
                  plan.featured ? "text-primary-foreground/50" : "text-muted-foreground/50"
                )}>
                  {plan.period}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className={cn(
              "mx-5 h-px",
              plan.featured ? "bg-primary-foreground/10" : "bg-border-subtle/40"
            )} />

            {/* Feature list */}
            <div className="p-5 pt-4 flex-1">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2.5">
                    <Check className={cn(
                      "w-3.5 h-3.5 flex-shrink-0 mt-0.5",
                      !feature.included && "opacity-0",
                      plan.featured
                        ? "text-primary-foreground/50"
                        : "text-muted-foreground/40"
                    )} />
                    <span className={cn(
                      "text-[12px] leading-snug",
                      !feature.included && (plan.featured ? "text-primary-foreground/25 line-through" : "text-muted-foreground/30 line-through"),
                      feature.included && !plan.featured && "text-foreground/75",
                      feature.included && plan.featured && "text-primary-foreground/85",
                    )}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              <Button
                variant={plan.featured ? "hero-outline" : "hero"}
                className={cn(
                  "w-full h-10 text-[12px] rounded-full",
                  plan.featured && "border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                )}
              >
                {plan.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;

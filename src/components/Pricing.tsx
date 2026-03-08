import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "First tracks free.",
    features: ["3 tracks / month", "Technical mode only", "Basic frequency analysis", "48h cooldown between uploads"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/ month",
    description: "Unlimited tracks, all modes.",
    features: ["Unlimited tracks", "All 3 listening modes", "Full detailed reports", "Priority processing", "PDF export"],
    cta: "Start Pro",
    featured: true,
  },
  {
    name: "Human Review",
    price: "$19",
    period: "/ month",
    description: "Pro plus engineer feedback.",
    features: ["Everything in Pro", "3 human reviews / month", "Human engineer review notes", "Revision guidance"],
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
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-lg border p-6 flex flex-col gap-5 transition-colors ${
              plan.featured
                ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_24px_-6px_hsl(var(--foreground)/0.12)] scale-[1.02]"
                : "bg-background border-border-subtle/50 hover:border-foreground/10"
            }`}
          >
            {plan.featured && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.12em] uppercase bg-primary-foreground text-primary px-3 py-1 rounded-full font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Most popular
              </span>
            )}
            <div>
              <h3 className="font-semibold tracking-tight text-[17px]">{plan.name}</h3>
              <p className={`text-[13px] mt-1 ${plan.featured ? "text-primary-foreground/65" : "text-muted-foreground/65"}`}>
                {plan.description}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[2rem] font-semibold tracking-tight">{plan.price}</span>
              <span className={`text-[13px] ${plan.featured ? "text-primary-foreground/55" : "text-muted-foreground/55"}`}>
                {plan.period}
              </span>
            </div>
            <ul className="space-y-2.5 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-[13px]">
                  <Check className={`w-3.5 h-3.5 flex-shrink-0 ${plan.featured ? "text-primary-foreground/60" : "text-muted-foreground/50"}`} />
                  <span className={plan.featured ? "" : "text-foreground/80"}>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={plan.featured ? "hero-outline" : "hero"}
              className={`w-full h-11 text-[13px] rounded-full ${
                plan.featured
                  ? "border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                  : ""
              }`}
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;

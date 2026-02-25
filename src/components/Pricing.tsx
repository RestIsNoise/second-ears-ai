import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try it out with your first tracks.",
    features: ["3 tracks / month", "Technical mode only", "Basic frequency analysis", "48h cooldown between uploads"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    description: "For producers who ship regularly.",
    features: ["Unlimited tracks", "All 3 listening modes", "Full detailed reports", "Priority processing", "Export PDF reports"],
    cta: "Start Pro trial",
    featured: true,
  },
  {
    name: "Human Review",
    price: "$49",
    period: "/ track",
    description: "AI + a real mixing engineer's ears.",
    features: ["Everything in Pro", "Human engineer review", "Video walkthrough", "1-on-1 follow-up", "Revision notes"],
    cta: "Book a review",
    featured: false,
  },
];

const Pricing = () => (
  <section id="pricing" className="py-24 px-6 border-t border-border-subtle">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">Simple pricing</p>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Pick your plan</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-8 flex flex-col gap-6 transition-colors ${
              plan.featured
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border-subtle hover:border-foreground/10"
            }`}
          >
            <div>
              <h3 className="font-semibold tracking-tight text-lg">{plan.name}</h3>
              <p className={`text-sm mt-1 ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {plan.description}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
              <span className={`text-sm ${plan.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {plan.period}
              </span>
            </div>
            <ul className="space-y-3 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <Check className={`w-4 h-4 flex-shrink-0 ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={plan.featured ? "hero-outline" : "hero"}
              className={`w-full h-11 text-sm ${
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

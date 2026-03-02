import { Zap, Target, Shield } from "lucide-react";

const props = [
  {
    icon: Zap,
    title: "Instant feedback",
    description: "Upload a track and get detailed mix analysis in under 30 seconds. No waiting, no scheduling.",
  },
  {
    icon: Target,
    title: "Actionable insights",
    description: "Not just what's wrong — exactly how to fix it. Frequency, dynamics, stereo, and more.",
  },
  {
    icon: Shield,
    title: "Reference-grade accuracy",
    description: "Trained on thousands of professional mixes. Calibrated against industry-standard monitoring.",
  },
];

const ValueProps = () => (
  <section id="features" className="py-24 px-6 border-t border-border-subtle scroll-mt-20">
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-3 gap-12 md:gap-16">
        {props.map((prop) => (
          <div key={prop.title} className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <prop.icon className="w-5 h-5 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{prop.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{prop.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ValueProps;

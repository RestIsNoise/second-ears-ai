import { Upload, BarChart3, ListChecks } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload your track",
    description: "Drag in any WAV, MP3, or FLAC file. Analysis starts immediately.",
    proof: "Supports files up to 100 MB",
  },
  {
    icon: BarChart3,
    number: "02",
    title: "Analyze three ways",
    description: "Technical, musical, and perception modes dissect your mix at exact timestamps.",
    proof: "Timestamps in MM:SS format",
  },
  {
    icon: ListChecks,
    number: "03",
    title: "Fix with a clear plan",
    description: "A prioritized to-do list and timeline walk you from biggest issue to final polish.",
    proof: "Shareable report link included",
  },
];

const HowItWorks = () => (
  <section className="relative py-20 md:py-24 px-6 border-t border-border-subtle">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <p className="font-mono-brand text-[11px] text-muted-foreground tracking-[0.4em] uppercase mb-3">
          How it works
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Three steps to a better mix
        </h2>
      </div>

      <div className="relative grid md:grid-cols-3 gap-10 md:gap-0">
        {/* Connector lines — desktop only */}
        <div className="hidden md:block absolute top-[38px] left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-border-subtle" aria-hidden="true" />

        {steps.map((step, i) => (
          <div key={step.number} className="relative flex flex-col items-center text-center md:px-8">
            {/* Step number + icon */}
            <div className="relative mb-5">
              <div className="w-[52px] h-[52px] rounded-xl bg-secondary flex items-center justify-center relative z-10">
                <step.icon className="w-5 h-5 text-foreground" strokeWidth={1.8} />
              </div>
              <span
                className="absolute -top-2 -right-3 font-mono-brand text-[10px] font-medium tracking-wider text-muted-foreground/40"
              >
                {step.number}
              </span>
            </div>

            <h3 className="text-base font-semibold tracking-tight mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mb-3">
              {step.description}
            </p>
            <p className="font-mono-brand text-[10px] text-muted-foreground/50 tracking-wider uppercase">
              {step.proof}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;

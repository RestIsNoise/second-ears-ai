import { Upload, BarChart3, ListChecks } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload",
    description: "Drop a WAV, MP3, or FLAC. Analysis starts on upload.",
    proof: "No setup required",
  },
  {
    icon: BarChart3,
    number: "02",
    title: "Analyze",
    description: "Three modes flag issues at exact timestamps in your track.",
    proof: "Clear next steps",
  },
  {
    icon: ListChecks,
    number: "03",
    title: "Fix",
    description: "A to-do list ranks issues by impact. Share one link with collaborators.",
    proof: "Shareable report",
  },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      className={`relative py-16 md:py-20 px-6 border-t border-border-subtle/50 reveal ${isVisible ? "is-visible" : ""}`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/60 tracking-[0.18em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            How it works
          </p>
          <h2 className="text-2xl md:text-[1.75rem] font-semibold tracking-tight">
            Upload, analyze, fix
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
          {/* Connector line with draw animation */}
          <div
            className="hidden md:block absolute top-[38px] left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-border-subtle/50 line-draw"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center md:px-8 reveal-child"
              style={{ "--stagger": `${300 + i * 120}ms` } as React.CSSProperties}
            >
              {/* Step number + icon */}
              <div className="relative mb-5">
                <div className="w-[52px] h-[52px] rounded-xl bg-secondary/60 flex items-center justify-center relative z-10 reveal-pop" style={{ "--stagger": `${400 + i * 120}ms` } as React.CSSProperties}>
                  <step.icon className="w-5 h-5 text-foreground/80" strokeWidth={1.8} />
                </div>
                <span
                  className="absolute -top-2 -right-3 text-[10px] font-medium tracking-wider text-muted-foreground/40"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {step.number}
                </span>
              </div>

              <h3 className="text-[15px] font-semibold tracking-tight mb-2">{step.title}</h3>
              <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-[240px] mb-3">
                {step.description}
              </p>
              <p
                className="text-[9px] text-muted-foreground/50 tracking-[0.12em] uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {step.proof}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

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
      className={`relative py-20 md:py-24 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Top waveform-inspired separator */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "hsl(var(--border-subtle) / 0.5)" }} />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/50 tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            How it works
          </p>
          <h2 className="text-[1.5rem] md:text-[1.65rem] font-semibold tracking-[-0.03em]">
            Upload, analyze, fix
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-[38px] left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px line-draw"
            aria-hidden="true"
            style={{ background: "hsl(var(--border-subtle) / 0.4)" }}
          />

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center md:px-8 reveal-child"
              style={{ "--stagger": `${300 + i * 120}ms` } as React.CSSProperties}
            >
              <div className="relative mb-6">
                <div
                  className="w-[52px] h-[52px] rounded-xl flex items-center justify-center relative z-10 reveal-pop"
                  style={{
                    "--stagger": `${400 + i * 120}ms`,
                    background: "hsl(var(--secondary) / 0.6)",
                    border: "1px solid hsl(var(--border-subtle) / 0.4)",
                  } as React.CSSProperties}
                >
                  <step.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.6} />
                </div>
                <span
                  className="absolute -top-2.5 -right-3.5 text-[10px] font-medium tracking-wider text-muted-foreground/30"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {step.number}
                </span>
              </div>

              <h3 className="text-[14px] font-semibold tracking-[-0.02em] mb-2">{step.title}</h3>
              <p className="text-[12.5px] text-muted-foreground/65 leading-[1.65] max-w-[220px] mb-3">
                {step.description}
              </p>
              <p
                className="text-[9px] text-muted-foreground/40 tracking-[0.14em] uppercase"
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

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
      className={`relative py-16 md:py-20 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-a))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/50 tracking-[0.18em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            How it works
          </p>
          <h2 className="text-[1.35rem] md:text-[1.5rem] font-semibold tracking-[-0.03em]">
            Upload, analyze, fix
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-[38px] left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px line-draw"
            aria-hidden="true"
            style={{ background: "hsl(var(--border-subtle) / 0.35)" }}
          />

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center md:px-6 reveal-child"
              style={{ "--stagger": `${300 + i * 120}ms` } as React.CSSProperties}
            >
              <div className="relative mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10 reveal-pop"
                  style={{
                    "--stagger": `${400 + i * 120}ms`,
                    background: "hsl(var(--surface-b))",
                    border: "1px solid hsl(var(--border-subtle) / 0.5)",
                    boxShadow: "0 1px 2px hsl(0 0% 0% / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
                  } as React.CSSProperties}
                >
                  <step.icon className="w-[18px] h-[18px] text-foreground/65" strokeWidth={1.5} />
                </div>
                <span
                  className="absolute -top-2 -right-3 text-[10px] font-medium tracking-wider text-muted-foreground/25"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {step.number}
                </span>
              </div>

              <h3 className="text-[13px] font-semibold tracking-[-0.02em] mb-1.5">{step.title}</h3>
              <p className="text-[12px] text-muted-foreground/60 leading-[1.65] max-w-[200px] mb-2.5">
                {step.description}
              </p>
              <p
                className="text-[9px] text-muted-foreground/35 tracking-[0.14em] uppercase"
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

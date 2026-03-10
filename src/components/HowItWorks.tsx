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
      className={`relative py-14 md:py-18 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-a))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto">
        {/* Left-aligned heading with extending rule — editorial feel */}
        <div className="mb-14 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <div className="flex items-center gap-4 mb-4">
            <p
              className="text-[10px] text-muted-foreground/45 tracking-[0.2em] uppercase shrink-0"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Process
            </p>
            <div className="h-px flex-1" style={{ background: "hsl(var(--border-subtle) / 0.35)" }} />
          </div>
          <h2 className="text-[1.5rem] md:text-[1.75rem] font-semibold tracking-[-0.035em] leading-tight">
            Upload, analyze, fix
          </h2>
          <p className="text-[12.5px] text-muted-foreground/55 mt-2 leading-relaxed max-w-sm">
            Three steps from raw file to a ranked list of improvements.
          </p>
        </div>

        {/* Inset panel container */}
        <div
          className="rounded-lg p-6 md:p-8 reveal-child"
          style={{
            "--stagger": "100ms",
            background: "hsl(var(--surface-b) / 0.6)",
            border: "1px solid hsl(var(--border-subtle) / 0.3)",
            boxShadow: "inset 0 2px 4px hsl(0 0% 0% / 0.02)",
          } as React.CSSProperties}
        >
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-[28px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px line-draw"
              aria-hidden="true"
              style={{ background: "hsl(var(--border-subtle) / 0.3)" }}
            />

            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center reveal-child"
                style={{ "--stagger": `${250 + i * 140}ms` } as React.CSSProperties}
              >
                <div className="relative mb-5">
                  <div
                    className="w-[52px] h-[52px] rounded-xl flex items-center justify-center relative z-10 reveal-pop"
                    style={{
                      "--stagger": `${350 + i * 140}ms`,
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border-subtle) / 0.45)",
                      boxShadow: "0 2px 6px hsl(0 0% 0% / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
                    } as React.CSSProperties}
                  >
                    <step.icon className="w-[18px] h-[18px] text-foreground/60" strokeWidth={1.5} />
                  </div>
                  <span
                    className="absolute -top-2 -right-3.5 text-[10px] font-medium tracking-wider text-muted-foreground/20"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="text-[13px] font-semibold tracking-[-0.02em] mb-1.5">{step.title}</h3>
                <p className="text-[12px] text-muted-foreground/55 leading-[1.65] max-w-[200px] mb-2.5">
                  {step.description}
                </p>
                <p
                  className="text-[9px] text-muted-foreground/30 tracking-[0.14em] uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {step.proof}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

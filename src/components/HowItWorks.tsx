import { Upload, BarChart3, ListChecks, ChevronRight } from "lucide-react";
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
      className={`relative py-16 md:py-22 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-a))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="mb-16 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <div className="flex items-center gap-4 mb-4">
            <p
              className="text-[10px] text-muted-foreground/40 tracking-[0.2em] uppercase shrink-0"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Process
            </p>
            <div className="h-px flex-1" style={{ background: "hsl(var(--border-subtle) / 0.3)" }} />
          </div>
          <h2 className="text-[1.5rem] md:text-[1.75rem] font-semibold tracking-[-0.035em] leading-tight">
            Upload, analyze, fix
          </h2>
          <p className="text-[12.5px] text-muted-foreground/50 mt-2 leading-relaxed max-w-sm">
            Three steps from raw file to a ranked list of improvements.
          </p>
        </div>

        {/* Steps — horizontal on desktop, stacked on mobile */}
        <div className="relative">
          {/* Vertical connector line on mobile */}
          <div
            className="md:hidden absolute left-[25px] top-[52px] bottom-[52px] w-px line-draw"
            aria-hidden="true"
            style={{ background: "hsl(var(--border-subtle) / 0.25)" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative reveal-child"
                style={{ "--stagger": `${150 + i * 120}ms` } as React.CSSProperties}
              >
                {/* Card */}
                <div
                  className="relative p-5 md:p-6 h-full flex flex-col"
                  style={{
                    background: "hsl(var(--card))",
                    borderRight: i < 2 ? "1px solid hsl(var(--border-subtle) / 0.25)" : "none",
                    borderBottom: "1px solid hsl(var(--border-subtle) / 0.25)",
                    borderTop: "1px solid hsl(var(--border-subtle) / 0.25)",
                    borderLeft: i === 0 ? "1px solid hsl(var(--border-subtle) / 0.25)" : "none",
                    borderRadius: i === 0 ? "8px 0 0 8px" : i === 2 ? "0 8px 8px 0" : "0",
                    boxShadow: "0 1px 3px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.65)",
                  }}
                >
                  {/* Top row: number + icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="text-[11px] font-medium text-muted-foreground/25 tracking-wider"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {step.number}
                    </span>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center reveal-pop"
                      style={{
                        "--stagger": `${250 + i * 120}ms`,
                        background: "hsl(var(--surface-b))",
                        border: "1px solid hsl(var(--border-subtle) / 0.45)",
                        boxShadow:
                          "inset 0 1px 0 hsl(0 0% 100% / 0.55), inset 0 -1px 0 hsl(0 0% 0% / 0.03), 0 1px 2px hsl(0 0% 0% / 0.05)",
                      } as React.CSSProperties}
                    >
                      <step.icon className="w-[15px] h-[15px] text-foreground/55" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Thin rule */}
                  <div
                    className="h-px w-full mb-4"
                    style={{ background: "hsl(var(--border-subtle) / 0.2)" }}
                  />

                  {/* Title */}
                  <h3 className="text-[14px] font-semibold tracking-[-0.02em] mb-2 text-foreground/85">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[12px] text-muted-foreground/50 leading-[1.7] mb-4 flex-1">
                    {step.description}
                  </p>

                  {/* Proof tag */}
                  <p
                    className="text-[9px] text-muted-foreground/30 tracking-[0.14em] uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {step.proof}
                  </p>
                </div>

                {/* Arrow connector between cards on desktop */}
                {i < 2 && (
                  <div
                    className="hidden md:flex absolute -right-[7px] top-1/2 -translate-y-1/2 z-10 w-[14px] h-[14px] rounded-full items-center justify-center"
                    style={{
                      background: "hsl(var(--surface-a))",
                      border: "1px solid hsl(var(--border-subtle) / 0.35)",
                    }}
                  >
                    <ChevronRight className="w-[8px] h-[8px] text-muted-foreground/30" strokeWidth={2} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

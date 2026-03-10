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
      className={`relative py-14 md:py-20 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-a))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
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

        {/* Signal chain rail */}
        <div
          className="relative reveal-child rounded-lg overflow-hidden"
          style={{
            "--stagger": "100ms",
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border-subtle) / 0.35)",
            boxShadow: "0 1px 3px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
          } as React.CSSProperties}
        >
          {/* Top bar — module header strip */}
          <div
            className="flex items-center gap-3 px-5 py-2.5"
            style={{
              background: "hsl(var(--surface-b) / 0.7)",
              borderBottom: "1px solid hsl(var(--border-subtle) / 0.25)",
            }}
          >
            <div className="flex gap-[5px]">
              <div className="w-[7px] h-[7px] rounded-full" style={{ background: "hsl(var(--border-subtle) / 0.5)" }} />
              <div className="w-[7px] h-[7px] rounded-full" style={{ background: "hsl(var(--border-subtle) / 0.35)" }} />
              <div className="w-[7px] h-[7px] rounded-full" style={{ background: "hsl(var(--border-subtle) / 0.2)" }} />
            </div>
            <span
              className="text-[9px] text-muted-foreground/30 tracking-[0.18em] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Signal chain
            </span>
          </div>

          {/* Steps row */}
          <div className="grid grid-cols-1 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative reveal-child"
                style={{ "--stagger": `${200 + i * 100}ms` } as React.CSSProperties}
              >
                <div
                  className="relative px-5 py-5 md:py-6 flex flex-col h-full"
                  style={{
                    borderRight: i < 2 ? "1px solid hsl(var(--border-subtle) / 0.2)" : "none",
                    borderBottom: i < 2 ? "1px solid hsl(var(--border-subtle) / 0.2)" : "none",
                  }}
                >
                  {/* Number + Icon row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 reveal-pop"
                      style={{
                        "--stagger": `${300 + i * 100}ms`,
                        background: "hsl(var(--surface-b))",
                        border: "1px solid hsl(var(--border-subtle) / 0.4)",
                        boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.5), 0 1px 2px hsl(0 0% 0% / 0.04)",
                      } as React.CSSProperties}
                    >
                      <step.icon className="w-[14px] h-[14px] text-foreground/50" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-[10px] text-muted-foreground/20 tracking-wider"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {step.number}
                      </span>
                      <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-foreground/85">
                        {step.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11.5px] text-muted-foreground/45 leading-[1.7] mb-3 flex-1">
                    {step.description}
                  </p>

                  {/* Proof */}
                  <p
                    className="text-[9px] text-muted-foreground/25 tracking-[0.14em] uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {step.proof}
                  </p>
                </div>

                {/* Arrow connector on desktop */}
                {i < 2 && (
                  <div
                    className="hidden md:block absolute -right-px top-1/2 -translate-y-1/2 z-10"
                    aria-hidden="true"
                  >
                    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="translate-x-[4px]">
                      <path
                        d="M1 1L8 8L1 15"
                        stroke="hsl(var(--border-subtle))"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.3"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar — signal flow indicator */}
          <div
            className="flex items-center justify-between px-5 py-2"
            style={{
              background: "hsl(var(--surface-b) / 0.5)",
              borderTop: "1px solid hsl(var(--border-subtle) / 0.2)",
            }}
          >
            <span
              className="text-[8px] text-muted-foreground/20 tracking-[0.15em] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Input
            </span>
            <div className="flex-1 mx-4 h-px" style={{ background: "linear-gradient(90deg, hsl(var(--border-subtle) / 0.25), hsl(var(--border-subtle) / 0.08))" }} />
            <span
              className="text-[8px] text-muted-foreground/20 tracking-[0.15em] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Output
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

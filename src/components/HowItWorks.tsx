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
      className={`relative py-16 md:py-24 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-a))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-14 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <div className="flex items-center gap-4 mb-5">
            <p
              className="text-[13px] text-foreground/60 tracking-[0.2em] uppercase shrink-0 font-bold"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Process
            </p>
            <div className="h-px flex-1" style={{ background: "hsl(var(--foreground) / 0.12)" }} />
          </div>
          <h2 className="text-[2rem] md:text-[2.5rem] font-bold tracking-[-0.035em] leading-tight text-foreground">
            Upload, analyze, fix
          </h2>
          <p className="text-[15px] text-foreground/70 mt-3 leading-relaxed max-w-md">
            Three steps from raw file to a ranked list of improvements.
          </p>
        </div>

        {/* Signal chain rail */}
        <div
          className="relative reveal-child rounded-lg overflow-hidden"
          style={{
            "--stagger": "100ms",
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--foreground) / 0.14)",
            boxShadow: "0 2px 8px hsl(0 0% 0% / 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
          } as React.CSSProperties}
        >
          {/* Top bar — module header strip */}
          <div
            className="flex items-center gap-3 px-6 py-3"
            style={{
              background: "hsl(var(--surface-b) / 0.9)",
              borderBottom: "1px solid hsl(var(--foreground) / 0.1)",
            }}
          >
            <div className="flex gap-[6px]">
              <div className="w-[9px] h-[9px] rounded-full" style={{ background: "hsl(var(--foreground) / 0.18)" }} />
              <div className="w-[9px] h-[9px] rounded-full" style={{ background: "hsl(var(--foreground) / 0.12)" }} />
              <div className="w-[9px] h-[9px] rounded-full" style={{ background: "hsl(var(--foreground) / 0.07)" }} />
            </div>
            <span
              className="text-[12px] text-foreground/50 tracking-[0.18em] uppercase font-bold"
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
                  className="relative px-7 py-7 md:py-8 flex flex-col h-full"
                  style={{
                    borderRight: i < 2 ? "1px solid hsl(var(--foreground) / 0.1)" : "none",
                    borderBottom: i < 2 ? "1px solid hsl(var(--foreground) / 0.1)" : "none",
                  }}
                >
                  {/* Number + Icon row */}
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="w-11 h-11 rounded-md flex items-center justify-center shrink-0 reveal-pop"
                      style={{
                        "--stagger": `${300 + i * 100}ms`,
                        background: "hsl(var(--surface-b))",
                        border: "1px solid hsl(var(--foreground) / 0.1)",
                        boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.5), 0 1px 3px hsl(0 0% 0% / 0.07)",
                      } as React.CSSProperties}
                    >
                      <step.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.8} />
                    </div>
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className="text-[13px] text-foreground/30 tracking-wider font-semibold"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {step.number}
                      </span>
                      <h3 className="text-[20px] font-bold tracking-[-0.02em] text-foreground">
                        {step.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[15px] text-foreground/75 leading-[1.75] mb-5 flex-1">
                    {step.description}
                  </p>

                  {/* Proof */}
                  <p
                    className="text-[12px] text-foreground/50 tracking-[0.14em] uppercase font-bold"
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
                    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" className="translate-x-[5px]">
                      <path
                        d="M1 1L10 10L1 19"
                        stroke="hsl(var(--foreground))"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.15"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar — signal flow indicator */}
          <div
            className="flex items-center justify-between px-6 py-3"
            style={{
              background: "hsl(var(--surface-b) / 0.7)",
              borderTop: "1px solid hsl(var(--foreground) / 0.07)",
            }}
          >
            <span
              className="text-[11px] text-foreground/35 tracking-[0.15em] uppercase font-bold"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Input
            </span>
            <div className="flex-1 mx-4 h-px" style={{ background: "linear-gradient(90deg, hsl(var(--foreground) / 0.1), hsl(var(--foreground) / 0.03))" }} />
            <span
              className="text-[11px] text-foreground/35 tracking-[0.15em] uppercase font-bold"
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

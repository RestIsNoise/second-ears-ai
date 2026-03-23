import { Play } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const MONO = "'IBM Plex Mono', monospace";

const DemoSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      id="demo-section"
      className={`relative py-24 md:py-32 px-6 scroll-mt-20 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-a))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="mx-auto" style={{ maxWidth: 900 }}>
        {/* Heading */}
        <div className="text-center mb-12 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/40 tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: MONO }}
          >
            Demo
          </p>
          <h2 className="text-[1.4rem] md:text-[1.6rem] font-semibold tracking-[-0.035em]">
            See it in action
          </h2>
        </div>

        {/* Video placeholder */}
        <div
          className="reveal-child"
          style={{ "--stagger": "120ms" } as React.CSSProperties}
        >
          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{
              aspectRatio: "16 / 9",
              background: "hsl(0 0% 10%)",
              border: "1px solid hsl(0 0% 100% / 0.08)",
              boxShadow:
                "0 4px 24px hsl(0 0% 0% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.04)",
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {/* Play icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "hsl(0 0% 100% / 0.08)",
                  border: "1px solid hsl(0 0% 100% / 0.12)",
                }}
              >
                <Play
                  className="w-6 h-6 ml-0.5"
                  style={{ color: "hsl(0 0% 100% / 0.5)" }}
                  fill="hsl(0 0% 100% / 0.15)"
                />
              </div>
              <p
                className="text-[12px] tracking-[0.08em] uppercase"
                style={{
                  fontFamily: MONO,
                  color: "hsl(0 0% 100% / 0.3)",
                  fontWeight: 500,
                }}
              >
                Video coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;

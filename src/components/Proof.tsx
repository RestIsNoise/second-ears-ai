import { Search, FileText, ShieldCheck } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const blocks = [
  {
    icon: Search,
    title: "Measurements",
    label: "01",
    items: [
      "Loudness (LUFS, peak dBTP)",
      "Dynamic range and crest factor",
      "Stereo image and correlation",
      "Sub/kick balance",
    ],
  },
  {
    icon: FileText,
    title: "Deliverables",
    label: "02",
    items: [
      "Timestamped issues with fixes",
      "Per-mode analysis breakdown",
      "Top issue, biggest win, next move",
      "One shareable report link",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Privacy",
    label: "03",
    items: [
      "Files stay private",
      "Never used for model training",
      "Delete tracks anytime",
    ],
  },
];

const Proof = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      id="features"
      className={`relative py-24 md:py-32 px-6 scroll-mt-20 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-b))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="mx-auto" style={{ maxWidth: 900 }}>
        {/* Heading */}
        <div className="text-center mb-14 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <div className="flex items-center gap-4 justify-center mb-5">
            <div className="h-px w-12" style={{ background: "hsl(var(--border-subtle) / 0.3)" }} />
            <p
              className="text-[10px] text-muted-foreground/40 tracking-[0.2em] uppercase shrink-0"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Specifics
            </p>
            <div className="h-px w-12" style={{ background: "hsl(var(--border-subtle) / 0.3)" }} />
          </div>
          <h2 className="text-[1.4rem] md:text-[1.6rem] font-semibold tracking-[-0.035em]">
            What you get
          </h2>
        </div>

        {/* Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 reveal-child"
          style={{ "--stagger": "100ms" } as React.CSSProperties}
        >
          {blocks.map((block, i) => (
            <div
              key={block.title}
              className="relative rounded-lg overflow-hidden reveal-child"
              style={{
                "--stagger": `${150 + i * 120}ms`,
                background: "hsl(var(--surface-a))",
                border: "1px solid hsl(var(--border-subtle))",
                minHeight: 220,
                boxShadow:
                  "0 1px 3px hsl(0 0% 0% / 0.04), 0 4px 12px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
              } as React.CSSProperties}
            >
              {/* Panel header bar */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  background: "hsl(var(--surface-c))",
                  borderBottom: "1px solid hsl(var(--border-subtle) / 0.3)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 reveal-pop"
                    style={{
                      "--stagger": `${250 + i * 120}ms`,
                      background: "hsl(var(--surface-a))",
                      border: "1px solid hsl(var(--border-subtle) / 0.4)",
                      boxShadow:
                        "inset 0 1px 0 hsl(0 0% 100% / 0.5), 0 1px 2px hsl(0 0% 0% / 0.06)",
                    } as React.CSSProperties}
                  >
                    <block.icon className="w-3 h-3 text-foreground/50" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[12px] font-semibold tracking-[-0.01em] text-foreground/85">
                    {block.title}
                  </h3>
                </div>
                <span
                  className="text-[9px] text-muted-foreground/30 tracking-[0.1em]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {block.label}
                </span>
              </div>

              {/* Items */}
              <div className="px-5 py-4">
                <ul className="space-y-0">
                  {block.items.map((item, j) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[12px] text-muted-foreground/60 leading-[1.55] py-2"
                      style={{
                        borderTop:
                          j > 0
                            ? "1px solid hsl(var(--border-subtle) / 0.15)"
                            : "none",
                      }}
                    >
                      <span
                        className="w-[3px] h-[3px] rounded-full shrink-0 mt-[7px]"
                        style={{ background: "hsl(var(--foreground) / 0.15)" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Proof;

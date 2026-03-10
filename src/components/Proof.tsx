import { Search, FileText, ShieldCheck } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const blocks = [
  {
    icon: Search,
    title: "Measurements",
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
      className={`relative py-16 md:py-22 px-6 scroll-mt-20 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-b))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto">
        {/* Center-aligned heading with flanking rules — spec sheet feel */}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px rounded-lg overflow-hidden reveal-child"
          style={{
            "--stagger": "100ms",
            background: "hsl(var(--border-subtle) / 0.3)",
            border: "1px solid hsl(var(--border-subtle) / 0.3)",
          } as React.CSSProperties}
        >
          {blocks.map((block, i) => (
            <div
              key={block.title}
              className="p-6 space-y-4 reveal-child"
              style={{
                "--stagger": `${150 + i * 120}ms`,
                background: "hsl(var(--surface-a))",
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 reveal-pop"
                  style={{
                    "--stagger": `${250 + i * 120}ms`,
                    background: "hsl(var(--surface-c))",
                    border: "1px solid hsl(var(--border-subtle) / 0.35)",
                    boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.4)",
                  } as React.CSSProperties}
                >
                  <block.icon className="w-3.5 h-3.5 text-foreground/55" strokeWidth={1.5} />
                </div>
                <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-foreground/90">{block.title}</h3>
              </div>
              <div
                className="h-px w-8"
                style={{ background: "hsl(var(--border-subtle) / 0.25)" }}
              />
              <ul className="space-y-2.5 pl-0">
                {block.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[12px] text-muted-foreground/55 leading-[1.6]">
                    <span
                      className="w-[3px] h-[3px] rounded-full shrink-0 mt-[7px]"
                      style={{ background: "hsl(var(--foreground) / 0.12)" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Proof;

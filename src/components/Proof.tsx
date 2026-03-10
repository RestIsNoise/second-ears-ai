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
      className={`relative py-20 md:py-24 px-6 scroll-mt-20 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "hsl(var(--border-subtle) / 0.5)" }} />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/50 tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            Specifics
          </p>
          <h2 className="text-[1.5rem] md:text-[1.65rem] font-semibold tracking-[-0.03em]">
            What you get
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {blocks.map((block, i) => (
            <div
              key={block.title}
              className="space-y-4 reveal-child"
              style={{ "--stagger": `${100 + i * 100}ms` } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 reveal-pop"
                  style={{
                    "--stagger": `${200 + i * 100}ms`,
                    background: "hsl(var(--secondary) / 0.6)",
                    border: "1px solid hsl(var(--border-subtle) / 0.35)",
                  } as React.CSSProperties}
                >
                  <block.icon className="w-4 h-4 text-foreground/70" strokeWidth={1.6} />
                </div>
                <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-foreground">{block.title}</h3>
              </div>
              <ul className="space-y-2.5 pl-0">
                {block.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-muted-foreground/65 leading-[1.6]">
                    <span className="w-1 h-1 rounded-full bg-foreground/15 shrink-0 mt-[7px]" />
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

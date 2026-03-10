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
      className={`relative py-16 md:py-20 px-6 scroll-mt-20 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-b))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/50 tracking-[0.18em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            Specifics
          </p>
          <h2 className="text-[1.35rem] md:text-[1.5rem] font-semibold tracking-[-0.03em]">
            What you get
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {blocks.map((block, i) => (
            <div
              key={block.title}
              className="rounded-lg p-5 space-y-4 reveal-child"
              style={{
                "--stagger": `${100 + i * 100}ms`,
                background: "hsl(var(--surface-a))",
                border: "1px solid hsl(var(--border-subtle) / 0.4)",
                boxShadow: "0 1px 3px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 reveal-pop"
                  style={{
                    "--stagger": `${200 + i * 100}ms`,
                    background: "hsl(var(--surface-c))",
                    border: "1px solid hsl(var(--border-subtle) / 0.4)",
                    boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.4)",
                  } as React.CSSProperties}
                >
                  <block.icon className="w-3.5 h-3.5 text-foreground/60" strokeWidth={1.5} />
                </div>
                <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-foreground">{block.title}</h3>
              </div>
              <ul className="space-y-2 pl-0">
                {block.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[12px] text-muted-foreground/60 leading-[1.6]">
                    <span
                      className="w-1 h-1 rounded-full shrink-0 mt-[7px]"
                      style={{ background: "hsl(var(--foreground) / 0.15)" }}
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

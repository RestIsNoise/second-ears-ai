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
  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
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
              className="text-[10px] tracking-[0.2em] uppercase shrink-0"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: isDark ? "#555" : undefined }}
            >
              What's included
            </p>
            <div className="h-px w-12" style={{ background: "hsl(var(--border-subtle) / 0.3)" }} />
          </div>
          <h2 className="text-[1.4rem] md:text-[1.6rem] font-semibold tracking-[-0.035em]">
            What you get
          </h2>
        </div>

        {/* Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 reveal-child"
          style={{ "--stagger": "100ms", gap: 24 } as React.CSSProperties}
        >
          {blocks.map((block, i) => (
            <div
              key={block.title}
              className="relative reveal-child"
              style={{
                "--stagger": `${150 + i * 120}ms`,
                background: isDark ? "#1a1a1a" : "hsl(0 0% 100%)",
                border: isDark ? "1px solid #2a2a2a" : "1px solid hsl(0 0% 91%)",
                borderRadius: 8,
                padding: 28,
              } as React.CSSProperties}
            >
              {/* Number badge top-right */}
              <span
                className="absolute"
                style={{
                  top: 16,
                  right: 16,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: "hsl(0 0% 73%)",
                }}
              >
                {block.label}
              </span>

              {/* Icon + Title */}
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    background: "hsl(0 0% 96%)",
                    border: "1px solid hsl(0 0% 91%)",
                  }}
                >
                  <block.icon className="w-3 h-3 text-foreground/50" strokeWidth={1.5} />
                </div>
                <h3 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: isDark ? "#e8e8e0" : "hsl(var(--foreground) / 0.85)" }}>
                  {block.title}
                </h3>
              </div>

              {/* Items */}
              <ul className="space-y-0">
                {block.items.map((item, j) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[13px] leading-[1.6] py-2"
                    style={{
                      color: "hsl(0 0% 40%)",
                      borderTop: j > 0 ? "1px solid hsl(0 0% 94%)" : "none",
                    }}
                  >
                    <span
                      className="w-[3px] h-[3px] rounded-full shrink-0 mt-[8px]"
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

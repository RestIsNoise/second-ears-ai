import { Search, FileText, ShieldCheck } from "lucide-react";

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

const Proof = () => (
  <section id="features" className="py-16 md:py-20 px-6 border-t border-border-subtle/50 scroll-mt-20">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p
          className="text-[10px] text-muted-foreground/60 tracking-[0.18em] uppercase mb-3"
          style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
        >
          Specifics
        </p>
        <h2 className="text-2xl md:text-[1.75rem] font-semibold tracking-tight">
          What you get
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        {blocks.map((block) => (
          <div key={block.title} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                <block.icon className="w-4 h-4 text-foreground/80" strokeWidth={1.8} />
              </div>
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{block.title}</h3>
            </div>
            <ul className="space-y-2.5 pl-0">
              {block.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted-foreground/70 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-foreground/20 shrink-0 mt-[7px]" />
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

export default Proof;

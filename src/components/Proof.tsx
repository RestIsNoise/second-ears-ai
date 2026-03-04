import { Search, FileText, ShieldCheck } from "lucide-react";

const blocks = [
  {
    icon: Search,
    title: "What we analyze",
    items: [
      "Integrated & short-term LUFS",
      "Dynamic range, crest factor, peak dBTP",
      "Stereo correlation & width",
      "Sub/kick balance ratio",
      "Section contrast & arrangement flow",
    ],
  },
  {
    icon: FileText,
    title: "What you get",
    items: [
      "Timestamped issues with actionable fixes",
      "Full analysis cards per listening mode",
      "One highest-priority action highlighted",
      "Shareable report link",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Why producers trust it",
    items: [
      "Private by default — files never shared",
      "Audio not used for AI training",
      "Delete your tracks at any time",
    ],
  },
];

const Proof = () => (
  <section id="features" className="py-14 md:py-16 px-6 border-t border-border-subtle scroll-mt-20">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="font-mono-brand text-[11px] text-muted-foreground tracking-[0.4em] uppercase mb-3">
          Built for real workflows
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Concrete results, not promises
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        {blocks.map((block) => (
          <div key={block.title} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <block.icon className="w-4 h-4 text-foreground" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold tracking-tight">{block.title}</h3>
            </div>
            <ul className="space-y-2 pl-0">
              {block.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-foreground/25 shrink-0 mt-[7px]" />
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

import { ShieldCheck, EyeOff, FileAudio } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const items = [
  { icon: ShieldCheck, label: "Private by default" },
  { icon: EyeOff, label: "Not used to train AI models" },
  { icon: FileAudio, label: "WAV · MP3 · FLAC supported" },
];

const TrustStrip = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      className={`relative py-10 md:py-12 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "hsl(var(--border-subtle) / 0.5)" }} />

      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
        {items.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 text-[11px] text-muted-foreground/55 tracking-wide reveal-child"
            style={{ "--stagger": `${i * 90}ms` } as React.CSSProperties}
          >
            <item.icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" strokeWidth={1.6} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustStrip;

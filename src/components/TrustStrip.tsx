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
    <section ref={ref} className={`py-8 md:py-10 px-6 border-t border-border-subtle/50 reveal-base ${isVisible ? "reveal-visible" : ""}`}>
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        {items.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-[12px] text-muted-foreground/60 tracking-wide reveal-child"
            style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
          >
            <item.icon className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={1.8} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustStrip;

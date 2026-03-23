import { ShieldCheck, EyeOff, FileAudio } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const items = [
  { icon: ShieldCheck, label: "Private by default" },
  { icon: EyeOff, label: "Not used to train AI models" },
  { icon: FileAudio, label: "WAV · MP3 · FLAC supported" },
];

const TrustStrip = () => {
  const { ref, isVisible } = useScrollReveal();
  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <section
      ref={ref}
      className={`relative py-8 md:py-10 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-b))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
        {items.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-[11px] tracking-wide reveal-child"
            style={{ "--stagger": `${i * 90}ms`, color: isDark ? "#555" : undefined } as React.CSSProperties}
          >
            <item.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} style={{ color: isDark ? "#555" : undefined }} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustStrip;

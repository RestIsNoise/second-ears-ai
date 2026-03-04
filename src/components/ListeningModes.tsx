import { Activity, Music, Eye } from "lucide-react";

const modes = [
  {
    icon: Activity,
    name: "Technical",
    tag: "Engineer view",
    description: "Loudness, dynamics, stereo image, and mix translation — focused on what to fix first.",
    points: ["Frequency balance", "Punch and headroom", "Stereo and mono compatibility", "Loudness control"],
  },
  {
    icon: Music,
    name: "Musical",
    tag: "Producer view",
    description: "Arrangement flow, section contrast, hook clarity, and emotional momentum.",
    points: ["Arrangement pacing", "Tonal balance", "Vocal presence", "Low-end weight"],
  },
  {
    icon: Eye,
    name: "Perception",
    tag: "Listener view",
    description: "How the mix translates on real speakers: impact, clarity, fatigue, and room response.",
    points: ["Speaker translation", "Listener impact", "Ear fatigue", "Playback compatibility"],
  },
];

const ListeningModes = () => (
  <section id="modes" className="py-14 md:py-16 px-6 bg-secondary/50 overflow-visible">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8 md:mb-10">
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">Three perspectives</p>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Listening modes</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {modes.map((mode) => (
          <div
            key={mode.name}
            className="bg-background rounded-xl border border-border-subtle p-7 md:p-8 flex flex-col gap-5 hover:border-foreground/10 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <mode.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{mode.name}</h3>
                <p className="font-mono-brand text-xs text-muted-foreground">{mode.tag}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
            <ul className="space-y-2 mt-auto">
              {mode.points.map((point) => (
                <li key={point} className="text-sm text-foreground flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-foreground/30" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ListeningModes;

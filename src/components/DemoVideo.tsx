import { Play } from "lucide-react";

const DemoVideo = () => (
  <section className="pt-8 md:pt-10 pb-16 md:pb-20 px-6">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">
          Product demo
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          See SecondEars in action
        </h2>
        <p className="text-sm text-muted-foreground/60 mt-2">
          Upload → Analyze → Fix in minutes
        </p>
      </div>

      {/* 16:9 video container */}
      <div className="relative aspect-video rounded-xl border border-border-subtle bg-secondary/30 overflow-hidden group cursor-pointer">
        {/* Placeholder poster */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-foreground/20 flex items-center justify-center group-hover:border-foreground/40 transition-colors">
            <Play className="w-6 h-6 text-foreground/50 group-hover:text-foreground/80 transition-colors ml-0.5" />
          </div>
          <p className="font-mono-brand text-[11px] text-muted-foreground/60 tracking-wider uppercase">
            Coming soon
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Upload, analyze, fix — in under 2 minutes
      </p>
    </div>
  </section>
);

export default DemoVideo;

const feedbackItems = [
  {
    time: "0:48",
    mode: "Musical",
    issue: "First drop lacks contrast — verse and chorus sit at the same energy level.",
    action: "Thin the verse arrangement or automate a filter sweep into the drop.",
  },
  {
    time: "2:12",
    mode: "Technical",
    issue: "Low-mid masking between kick and bass around 120–200 Hz.",
    action: "Sidechain the bass to the kick or carve a narrow cut on the bass at 160 Hz.",
  },
  {
    time: "3:36",
    mode: "Perception",
    issue: "Stereo image narrows noticeably in the densest section.",
    action: "Pan supporting elements wider or reduce center-channel layering.",
  },
];

const modeColor: Record<string, string> = {
  Musical: "hsl(0 0% 92%)",
  Technical: "hsl(0 0% 92%)",
  Perception: "hsl(0 0% 92%)",
};

const SampleFeedback = () => (
  <section className="py-14 md:py-16 px-6 border-t border-border-subtle">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <p className="font-mono-brand text-[11px] text-muted-foreground tracking-[0.3em] uppercase mb-3">
          Real output
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          See what SecondEars hears
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Every analysis returns timestamped issues with concrete next steps.
        </p>
      </div>

      <div
        className="max-w-2xl mx-auto rounded-xl border overflow-hidden"
        style={{
          borderColor: "hsl(0 0% 100% / 0.08)",
          background: "hsl(0 0% 7%)",
        }}
      >
        {/* Mock title bar */}
        <div
          className="flex items-center gap-2 px-5 py-3 border-b"
          style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "hsl(0 0% 25%)" }}
          />
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "hsl(0 0% 25%)" }}
          />
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "hsl(0 0% 25%)" }}
          />
          <span
            className="ml-3 text-[11px] font-mono-brand tracking-wide"
            style={{ color: "hsl(0 0% 38%)" }}
          >
            analysis · demo_track.wav
          </span>
        </div>

        {/* Feedback items */}
        <div className="divide-y" style={{ borderColor: "hsl(0 0% 100% / 0.05)" }}>
          {feedbackItems.map((item) => (
            <div
              key={item.time}
              className="px-5 py-4 flex gap-4"
              style={{ borderColor: "hsl(0 0% 100% / 0.05)" }}
            >
              {/* Timestamp */}
              <span
                className="font-mono-brand text-[13px] tabular-nums pt-0.5 shrink-0"
                style={{ color: "hsl(0 0% 50%)" }}
              >
                {item.time}
              </span>

              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Mode tag */}
                <span
                  className="inline-block text-[10px] font-medium tracking-wider uppercase rounded-full px-2.5 py-0.5"
                  style={{
                    background: "hsl(0 0% 14%)",
                    color: modeColor[item.mode],
                  }}
                >
                  {item.mode}
                </span>

                {/* Issue */}
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "hsl(0 0% 80%)" }}
                >
                  {item.issue}
                </p>

                {/* Action */}
                <p
                  className="text-[12px] leading-relaxed"
                  style={{ color: "hsl(0 0% 45%)" }}
                >
                  → {item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default SampleFeedback;

import { useEffect, useRef, useState } from "react";

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

const CHAR_SPEED = 18;   // ms per character
const LINE_PAUSE = 400;  // pause between lines within an item
const ITEM_PAUSE = 700;  // pause between items

type Phase = "time" | "mode" | "issue" | "action";

interface ItemState {
  visible: boolean;
  time: string;
  mode: string;
  issue: string;
  action: string;
  cursorPhase: Phase | "done";
}

const empty: ItemState = {
  visible: false,
  time: "",
  mode: "",
  issue: "",
  action: "",
  cursorPhase: "time",
};

const SampleFeedback = () => {
  const [items, setItems] = useState<ItemState[]>(
    feedbackItems.map(() => ({ ...empty }))
  );
  const [started, setStarted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection observer — start animation when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Typewriter engine
  useEffect(() => {
    if (!started) return;
    let cancelled = false;

    const sleep = (ms: number) =>
      new Promise<void>((r) => setTimeout(r, ms));

    const typeText = async (
      itemIdx: number,
      phase: Phase,
      fullText: string
    ) => {
      for (let i = 1; i <= fullText.length; i++) {
        if (cancelled) return;
        const slice = fullText.slice(0, i);
        setItems((prev) => {
          const next = [...prev];
          next[itemIdx] = { ...next[itemIdx], [phase]: slice, cursorPhase: phase };
          return next;
        });
        await sleep(CHAR_SPEED);
      }
    };

    const run = async () => {
      for (let idx = 0; idx < feedbackItems.length; idx++) {
        if (cancelled) return;
        const src = feedbackItems[idx];

        // Make item visible
        setItems((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], visible: true, cursorPhase: "time" };
          return next;
        });

        await typeText(idx, "time", src.time);
        await sleep(LINE_PAUSE * 0.5);

        await typeText(idx, "mode", src.mode);
        await sleep(LINE_PAUSE * 0.5);

        await typeText(idx, "issue", src.issue);
        await sleep(LINE_PAUSE);

        await typeText(idx, "action", `→ ${src.action}`);

        // Mark done
        setItems((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], cursorPhase: "done" };
          return next;
        });

        if (idx < feedbackItems.length - 1) await sleep(ITEM_PAUSE);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [started]);

  return (
    <section
      ref={sectionRef}
      className="py-14 md:py-16 px-6 border-t border-border-subtle"
    >
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
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
            <span
              className="ml-3 text-[11px] font-mono-brand tracking-wide"
              style={{ color: "hsl(0 0% 38%)" }}
            >
              analysis · demo_track.wav
            </span>
          </div>

          {/* Feedback items */}
          <div className="divide-y" style={{ borderColor: "hsl(0 0% 100% / 0.05)" }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                className="px-5 py-4 flex gap-4 transition-opacity duration-300"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.05)",
                  opacity: item.visible ? 1 : 0,
                  minHeight: item.visible ? undefined : 0,
                  height: item.visible ? "auto" : 0,
                  padding: item.visible ? undefined : "0 20px",
                  overflow: "hidden",
                }}
              >
                {/* Timestamp */}
                <span
                  className="font-mono-brand text-[13px] tabular-nums pt-0.5 shrink-0"
                  style={{ color: "hsl(0 0% 50%)" }}
                >
                  {item.time}
                  {item.cursorPhase === "time" && <Cursor />}
                </span>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Mode tag */}
                  {item.mode && (
                    <span
                      className="inline-block text-[10px] font-medium tracking-wider uppercase rounded-full px-2.5 py-0.5"
                      style={{
                        background: "hsl(0 0% 14%)",
                        color: "hsl(0 0% 92%)",
                      }}
                    >
                      {item.mode}
                      {item.cursorPhase === "mode" && <Cursor />}
                    </span>
                  )}

                  {/* Issue */}
                  {item.issue && (
                    <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 80%)" }}>
                      {item.issue}
                      {item.cursorPhase === "issue" && <Cursor />}
                    </p>
                  )}

                  {/* Action */}
                  {item.action && (
                    <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 45%)" }}>
                      {item.action}
                      {item.cursorPhase === "action" && <Cursor />}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/** Blinking cursor character */
const Cursor = () => (
  <span
    className="inline-block w-[2px] h-[0.9em] ml-[1px] align-middle"
    style={{
      background: "hsl(0 0% 60%)",
      animation: "cursor-blink 0.8s steps(2) infinite",
    }}
  />
);

export default SampleFeedback;

import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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

const CHAR_SPEED = 22;
const PHASE_PAUSE = 300;

type Phase = "time" | "mode" | "issue" | "action" | "done";

interface ItemState {
  time: string;
  mode: string;
  issue: string;
  action: string;
  phase: Phase;
}

const SampleFeedback = () => {
  const [items, setItems] = useState<ItemState[]>(
    feedbackItems.map(() => ({ time: "", mode: "", issue: "", action: "", phase: "time" }))
  );
  const [activeCursor, setActiveCursor] = useState<Phase>("time");
  const [started, setStarted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { ref: revealRef, isVisible } = useScrollReveal<HTMLElement>();

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

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const typeAll = async (phase: Phase, getter: (src: typeof feedbackItems[0]) => string, prefix = "") => {
      const texts = feedbackItems.map((src) => prefix + getter(src));
      const maxLen = Math.max(...texts.map((t) => t.length));

      setActiveCursor(phase);
      setItems((prev) => prev.map((it) => ({ ...it, phase })));

      for (let i = 1; i <= maxLen; i++) {
        if (cancelled) return;
        setItems((prev) =>
          prev.map((it, idx) => ({
            ...it,
            [phase]: texts[idx].slice(0, i),
          }))
        );
        await sleep(CHAR_SPEED);
      }
    };

    const run = async () => {
      await typeAll("time", (s) => s.time);
      await sleep(PHASE_PAUSE);
      await typeAll("mode", (s) => s.mode);
      await sleep(PHASE_PAUSE);
      await typeAll("issue", (s) => s.issue);
      await sleep(PHASE_PAUSE);
      await typeAll("action", (s) => s.action, "→ ");
      setActiveCursor("done");
      setItems((prev) => prev.map((it) => ({ ...it, phase: "done" })));
    };

    run();
    return () => { cancelled = true; };
  }, [started]);

  // Merge refs
  const setRefs = (el: HTMLElement | null) => {
    (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (revealRef as React.MutableRefObject<HTMLElement | null>).current = el;
  };

  return (
    <section
      ref={setRefs}
      className={`py-16 md:py-20 px-6 border-t border-border-subtle/50 reveal ${isVisible ? "is-visible" : ""}`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/60 tracking-[0.18em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            Real output
          </p>
          <h2 className="text-2xl md:text-[1.75rem] font-semibold tracking-tight mb-2.5">
            See what SecondEar hears
          </h2>
          <p className="text-[13px] text-muted-foreground/65 max-w-md mx-auto leading-relaxed">
            Every analysis returns timestamped issues with concrete next steps.
          </p>
        </div>

        <div
          className="max-w-2xl mx-auto rounded-xl border overflow-hidden reveal-child"
          style={{ borderColor: "hsl(0 0% 100% / 0.08)", background: "hsl(0 0% 7%)", "--stagger": "120ms" } as React.CSSProperties}
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-2 px-5 py-3 border-b"
            style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 0% 25%)" }} />
            <span
              className="ml-3 text-[11px] tracking-wide"
              style={{ color: "hsl(0 0% 42%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              analysis · demo_track.wav
            </span>
          </div>

          {/* All 3 rows */}
          <div className="divide-y" style={{ borderColor: "hsl(0 0% 100% / 0.05)" }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                className="px-5 py-4 flex gap-4"
                style={{ borderColor: "hsl(0 0% 100% / 0.05)" }}
              >
                <span
                  className="text-[13px] tabular-nums pt-0.5 shrink-0 min-w-[2.5rem]"
                  style={{ color: "hsl(0 0% 55%)", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {item.time}
                  {activeCursor === "time" && <Cursor />}
                </span>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {item.mode ? (
                    <span
                      className="inline-block text-[10px] font-medium tracking-wider uppercase rounded-full px-2.5 py-0.5"
                      style={{ background: "hsl(0 0% 14%)", color: "hsl(0 0% 92%)" }}
                    >
                      {item.mode}
                      {activeCursor === "mode" && <Cursor />}
                    </span>
                  ) : (
                    <span className="inline-block h-[22px]" />
                  )}

                  <p className="text-[13px] leading-relaxed min-h-[1.5em]" style={{ color: "hsl(0 0% 82%)" }}>
                    {item.issue}
                    {activeCursor === "issue" && <Cursor />}
                  </p>

                  <p className="text-[12px] leading-relaxed min-h-[1.35em]" style={{ color: "hsl(0 0% 50%)" }}>
                    {item.action}
                    {activeCursor === "action" && <Cursor />}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

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

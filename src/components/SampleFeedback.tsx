import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const feedbackItems = [
  {
    time: "0:48",
    mode: "Musical",
    issue: "First drop lacks contrast — verse and chorus sit at the same energy level.",
    action: "Thin the verse arrangement or automate a filter sweep into the drop.",
    severity: "med",
  },
  {
    time: "2:12",
    mode: "Technical",
    issue: "Low-mid masking between kick and bass around 120–200 Hz.",
    action: "Sidechain the bass to the kick or carve a narrow cut on the bass at 160 Hz.",
    severity: "high",
  },
  {
    time: "3:36",
    mode: "Perception",
    issue: "Stereo image narrows noticeably in the densest section.",
    action: "Pan supporting elements wider or reduce center-channel layering.",
    severity: "low",
  },
];

const modeColors: Record<string, string> = {
  Musical: "hsl(215 40% 52%)",
  Technical: "hsl(35 50% 52%)",
  Perception: "hsl(270 30% 55%)",
};

const severityDot: Record<string, string> = {
  high: "hsl(0 45% 50%)",
  med: "hsl(35 50% 52%)",
  low: "hsl(0 0% 36%)",
};

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

  const setRefs = (el: HTMLElement | null) => {
    (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (revealRef as React.MutableRefObject<HTMLElement | null>).current = el;
  };

  return (
    <section
      ref={setRefs}
      className={`relative py-24 md:py-32 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(0 0% 4.5%)" }}
    >
      {/* Noise grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "512px 512px",
        }}
      />

      {/* Subtle top edge line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 16%), transparent)" }}
      />

      <div className="relative mx-auto" style={{ maxWidth: 900 }}>
        {/* Heading area */}
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end mb-16 md:mb-20 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <div>
            <p
              className="text-[10px] tracking-[0.22em] uppercase mb-4 flex items-center gap-3"
              style={{ color: "hsl(0 0% 34%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <span className="w-5 h-px" style={{ background: "hsl(0 0% 24%)" }} />
              Real output
            </p>
            <h2
              className="text-[1.6rem] md:text-[1.9rem] font-semibold tracking-[-0.04em] leading-[1.15]"
              style={{ color: "hsl(0 0% 92%)" }}
            >
              See what SecondEar hears
            </h2>
          </div>
          <p
            className="text-[11.5px] leading-[1.65] max-w-[240px] hidden md:block"
            style={{ color: "hsl(0 0% 40%)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Every note has a timestamp, a severity, and a fix.
            <br />Nothing vague.
          </p>
        </div>

        {/* Mobile-only subtitle */}
        <p
          className="text-[12px] leading-relaxed mb-12 md:hidden reveal-child"
          style={{ color: "hsl(0 0% 40%)", fontFamily: "'IBM Plex Mono', monospace", "--stagger": "60ms" } as React.CSSProperties}
        >
          Every note has a timestamp, a severity, and a fix. Nothing vague.
        </p>

        {/* Panel container with enhanced framing */}
        <div
          className="reveal-child"
          style={{ "--stagger": "150ms" } as React.CSSProperties}
        >
          {/* Outer glow frame */}
          <div
            className="mx-auto max-w-2xl"
            style={{
              padding: "1px",
              borderRadius: "12px",
              background: "linear-gradient(180deg, hsl(0 0% 18%), hsl(0 0% 8%))",
              boxShadow: "0 0 80px -20px hsl(0 0% 0% / 0.8), 0 32px 64px -24px hsl(0 0% 0% / 0.7)",
            }}
          >
            <div
              className="overflow-hidden"
              style={{
                borderRadius: "11px",
                background: "hsl(0 0% 6.5%)",
              }}
            >
              {/* Title bar — enhanced studio chrome */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{
                  borderBottom: "1px solid hsl(0 0% 100% / 0.04)",
                  background: "linear-gradient(to bottom, hsl(0 0% 11%), hsl(0 0% 8.5%))",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex gap-[5px]">
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: "hsl(0 0% 22%)", boxShadow: "inset 0 1px 0 hsl(0 0% 28%)" }} />
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: "hsl(0 0% 22%)", boxShadow: "inset 0 1px 0 hsl(0 0% 28%)" }} />
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: "hsl(0 0% 22%)", boxShadow: "inset 0 1px 0 hsl(0 0% 28%)" }} />
                  </span>
                  <span
                    className="ml-2 text-[10px] tracking-[0.06em]"
                    style={{ color: "hsl(0 0% 30%)", fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    analysis
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[9px] tracking-[0.04em]"
                    style={{ color: "hsl(0 0% 24%)", fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    demo_track.wav
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      color: "hsl(0 0% 30%)",
                      background: "hsl(0 0% 10%)",
                      border: "1px solid hsl(0 0% 14%)",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    44.1kHz · 24bit
                  </span>
                </div>
              </div>

              {/* Column headers */}
              <div
                className="flex gap-4 px-5 py-1.5"
                style={{
                  borderBottom: "1px solid hsl(0 0% 100% / 0.03)",
                  background: "hsl(0 0% 7.5%)",
                }}
              >
                <span
                  className="text-[8px] tracking-[0.14em] uppercase shrink-0 min-w-[2.5rem]"
                  style={{ color: "hsl(0 0% 24%)", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Time
                </span>
                <span
                  className="text-[8px] tracking-[0.14em] uppercase flex-1"
                  style={{ color: "hsl(0 0% 24%)", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Diagnostic
                </span>
              </div>

              {/* Rows */}
              <div>
                {items.map((item, idx) => {
                  const src = feedbackItems[idx];
                  const accentColor = modeColors[src.mode] || "hsl(0 0% 50%)";
                  const sevColor = severityDot[src.severity] || "hsl(0 0% 36%)";

                  return (
                    <div
                      key={idx}
                      className="px-5 py-4 flex gap-4 group"
                      style={{
                        borderTop: idx > 0 ? "1px solid hsl(0 0% 100% / 0.025)" : "none",
                        borderLeft: `2px solid ${item.mode ? accentColor : "transparent"}`,
                        transition: "border-color 0.3s ease",
                      }}
                    >
                      {/* Timestamp + severity */}
                      <div className="shrink-0 min-w-[2.5rem] flex flex-col items-start gap-1.5 pt-0.5">
                        <span
                          className="text-[11.5px] tabular-nums"
                          style={{ color: "hsl(0 0% 50%)", fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {item.time}
                          {activeCursor === "time" && <Cursor />}
                        </span>
                        {item.phase === "done" && (
                          <span
                            className="w-[5px] h-[5px] rounded-full"
                            style={{ background: sevColor, opacity: 0.8 }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Mode tag */}
                        {item.mode ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[8.5px] font-medium tracking-[0.12em] uppercase rounded px-2 py-[3px]"
                            style={{
                              background: "hsl(0 0% 10%)",
                              color: accentColor,
                              border: "1px solid hsl(0 0% 100% / 0.05)",
                              boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.02)",
                            }}
                          >
                            <span
                              className="w-[4px] h-[4px] rounded-full"
                              style={{ background: accentColor, opacity: 0.7 }}
                            />
                            {item.mode}
                            {activeCursor === "mode" && <Cursor />}
                          </span>
                        ) : (
                          <span className="inline-block h-[20px]" />
                        )}

                        {/* Issue text */}
                        <p
                          className="text-[12.5px] leading-[1.65] min-h-[1.5em]"
                          style={{ color: "hsl(0 0% 76%)" }}
                        >
                          {item.issue}
                          {activeCursor === "issue" && <Cursor />}
                        </p>

                        {/* Action — styled as FIX row */}
                        <div className="flex items-start gap-2 min-h-[1.35em]">
                          {item.action && item.phase === "done" && (
                            <span
                              className="text-[7.5px] tracking-[0.1em] uppercase font-medium shrink-0 mt-[2px] px-1 py-[1px] rounded-sm"
                              style={{
                                color: "hsl(0 0% 45%)",
                                background: "hsl(0 0% 10%)",
                                border: "1px solid hsl(0 0% 15%)",
                              }}
                            >
                              fix
                            </span>
                          )}
                          <p
                            className="text-[11px] leading-[1.6]"
                            style={{ color: "hsl(0 0% 38%)" }}
                          >
                            {item.action}
                            {activeCursor === "action" && <Cursor />}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom status bar — enhanced */}
              <div
                className="px-5 py-2 flex items-center justify-between"
                style={{
                  borderTop: "1px solid hsl(0 0% 100% / 0.03)",
                  background: "linear-gradient(to bottom, hsl(0 0% 6%), hsl(0 0% 5%))",
                }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="text-[9px] tracking-[0.04em]"
                    style={{ color: "hsl(0 0% 26%)", fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    3 issues
                  </span>
                  <span className="w-px h-2.5" style={{ background: "hsl(0 0% 16%)" }} />
                  <span
                    className="text-[9px] tracking-[0.04em]"
                    style={{ color: "hsl(0 0% 26%)", fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    1 high · 1 med · 1 low
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-[5px] h-[5px] rounded-full"
                    style={{ background: "hsl(140 35% 40%)", boxShadow: "0 0 6px hsl(140 35% 40% / 0.4)" }}
                  />
                  <span
                    className="text-[9px] tracking-[0.04em]"
                    style={{ color: "hsl(0 0% 30%)", fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    complete
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Reflection / caption below panel */}
          <p
            className="text-center mt-8 text-[10px] tracking-[0.08em]"
            style={{ color: "hsl(0 0% 22%)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Actual output from a SecondEar analysis — not a mockup
          </p>
        </div>
      </div>
    </section>
  );
};

const Cursor = () => (
  <span
    className="inline-block w-[2px] h-[0.9em] ml-[1px] align-middle"
    style={{
      background: "hsl(0 0% 50%)",
      animation: "cursor-blink 0.8s steps(2) infinite",
    }}
  />
);

export default SampleFeedback;

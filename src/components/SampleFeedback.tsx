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

  const setRefs = (el: HTMLElement | null) => {
    (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (revealRef as React.MutableRefObject<HTMLElement | null>).current = el;
  };

  return (
    <section
      ref={setRefs}
      className={`relative py-20 md:py-28 px-6 reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(0 0% 5%)" }}
    >
      {/* Noise grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "512px 512px",
        }}
      />

      <div className="relative max-w-3xl mx-auto">
        {/* Asymmetric heading — left-aligned with right-side annotation */}
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end mb-14 md:mb-16 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <div>
            <p
              className="text-[10px] tracking-[0.2em] uppercase mb-3"
              style={{ color: "hsl(0 0% 38%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Real output
            </p>
            <h2
              className="text-[1.5rem] md:text-[1.75rem] font-semibold tracking-[-0.035em] leading-tight"
              style={{ color: "hsl(0 0% 90%)" }}
            >
              See what SecondEar hears
            </h2>
          </div>
          <p
            className="text-[12px] leading-relaxed max-w-[260px] hidden md:block"
            style={{ color: "hsl(0 0% 44%)" }}
          >
            Every analysis returns timestamped issues with concrete next steps.
          </p>
        </div>
        {/* Mobile-only subtitle */}
        <p
          className="text-[12.5px] leading-relaxed mb-10 md:hidden reveal-child"
          style={{ color: "hsl(0 0% 44%)", "--stagger": "60ms" } as React.CSSProperties}
        >
          Every analysis returns timestamped issues with concrete next steps.
        </p>

        <div
          className="max-w-2xl mx-auto overflow-hidden reveal-child"
          style={{
            borderRadius: "10px",
            border: "1px solid hsl(0 0% 100% / 0.05)",
            background: "hsl(0 0% 7%)",
            boxShadow: "0 1px 0 hsl(0 0% 100% / 0.02) inset, 0 16px 56px -16px hsl(0 0% 0% / 0.6)",
            "--stagger": "150ms",
          } as React.CSSProperties}
        >
          {/* Title bar — studio panel chrome */}
          <div
            className="flex items-center gap-2 px-5 py-2.5"
            style={{
              borderBottom: "1px solid hsl(0 0% 100% / 0.04)",
              background: "linear-gradient(to bottom, hsl(0 0% 10%), hsl(0 0% 8%))",
            }}
          >
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: "hsl(0 0% 20%)" }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: "hsl(0 0% 20%)" }} />
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: "hsl(0 0% 20%)" }} />
            <span
              className="ml-3 text-[10px] tracking-[0.08em]"
              style={{ color: "hsl(0 0% 32%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              analysis · demo_track.wav
            </span>
          </div>

          {/* Rows */}
          <div>
            {items.map((item, idx) => (
              <div
                key={idx}
                className="px-5 py-4 flex gap-4"
                style={{
                  borderTop: idx > 0 ? "1px solid hsl(0 0% 100% / 0.03)" : "none",
                }}
              >
                <span
                  className="text-[11.5px] tabular-nums pt-0.5 shrink-0 min-w-[2.5rem]"
                  style={{ color: "hsl(0 0% 46%)", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {item.time}
                  {activeCursor === "time" && <Cursor />}
                </span>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {item.mode ? (
                    <span
                      className="inline-block text-[9px] font-medium tracking-[0.1em] uppercase rounded px-2 py-0.5"
                      style={{ background: "hsl(0 0% 13%)", color: "hsl(0 0% 78%)", border: "1px solid hsl(0 0% 100% / 0.04)" }}
                    >
                      {item.mode}
                      {activeCursor === "mode" && <Cursor />}
                    </span>
                  ) : (
                    <span className="inline-block h-[22px]" />
                  )}

                  <p className="text-[12px] leading-[1.6] min-h-[1.5em]" style={{ color: "hsl(0 0% 74%)" }}>
                    {item.issue}
                    {activeCursor === "issue" && <Cursor />}
                  </p>

                  <p className="text-[11px] leading-[1.55] min-h-[1.35em]" style={{ color: "hsl(0 0% 40%)" }}>
                    {item.action}
                    {activeCursor === "action" && <Cursor />}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom chrome strip */}
          <div
            className="px-5 py-2 flex items-center justify-between"
            style={{
              borderTop: "1px solid hsl(0 0% 100% / 0.03)",
              background: "hsl(0 0% 6.5%)",
            }}
          >
            <span
              className="text-[9px] tracking-[0.06em]"
              style={{ color: "hsl(0 0% 28%)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              3 issues found
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: "hsl(140 40% 42%)" }} />
              <span
                className="text-[9px] tracking-[0.06em]"
                style={{ color: "hsl(0 0% 28%)", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                complete
              </span>
            </span>
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
      background: "hsl(0 0% 50%)",
      animation: "cursor-blink 0.8s steps(2) infinite",
    }}
  />
);

export default SampleFeedback;

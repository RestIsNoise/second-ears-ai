import { useEffect, useState, useRef } from "react";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const steps = [
  "Uploading track",
  "Reading audio",
  "Generating feedback",
  "Finalizing report",
];

const processingMessages = [
  "Mapping low-end balance",
  "Reading stereo field",
  "Checking transient response",
  "Evaluating section contrast",
  "Analyzing energy arc",
  "Checking mono compatibility",
  "Scanning frequency spectrum",
  "Measuring dynamic range",
  "Assessing tonal clarity",
  "Evaluating spatial depth",
];

const stepBaseTargets = [18, 25, 30, 95];

const getActiveStep = (percent: number) => {
  if (percent <= 20) return 0;
  if (percent <= 28) return 1;
  if (percent <= 88) return 2;
  return 3;
};

function useProcessingCrawl(currentStep: number) {
  const [crawlPercent, setCrawlPercent] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (currentStep !== 2) {
      startTimeRef.current = null;
      setCrawlPercent(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current!) / 1000;
      const t = Math.min(elapsed / 25, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCrawlPercent(Math.round(eased * 48));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [currentStep]);

  return crawlPercent;
}

function useRotatingMessage(active: boolean) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * processingMessages.length));
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setIdx((c) => (c + 1) % processingMessages.length), 4200);
    return () => clearInterval(id);
  }, [active]);
  return active ? processingMessages[idx] : null;
}

function useSmoothedProgress(targetPercent: number, stopped: boolean) {
  const displayRef = useRef(0);
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (stopped) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const current = displayRef.current;
      const speed = targetPercent >= 95 ? 0.12 : 0.045;
      const next = current + (targetPercent - current) * speed;
      const rounded = Math.round(next);
      if (rounded !== Math.round(current)) setDisplay(rounded);
      displayRef.current = next;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [targetPercent, stopped]);

  return display;
}

function useElapsedTime(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return elapsed;
}

function formatElapsed(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface AnalysisProgressProps {
  currentStep: number;
  error: string | null;
  onRetry: () => void;
  onCancel?: () => void;
}

const AnalysisProgress = ({ currentStep, error, onRetry, onCancel }: AnalysisProgressProps) => {
  const crawlPercent = useProcessingCrawl(currentStep);
  const isProcessing = currentStep === 2;
  const rotatingMessage = useRotatingMessage(isProcessing);
  const elapsed = useElapsedTime(!error);

  const baseTarget = stepBaseTargets[Math.min(currentStep, 3)];
  const targetPercent = error ? 0 : currentStep === 2 ? baseTarget + crawlPercent : baseTarget;
  const displayPercent = useSmoothedProgress(targetPercent, !!error);
  const activeStep = getActiveStep(displayPercent);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-20 animate-fade-in">
        <div
          className="w-full max-w-md rounded-lg overflow-hidden"
          style={{
            border: "1px solid hsl(var(--border-subtle) / 0.6)",
            backgroundColor: "hsl(var(--card))",
          }}
        >
          {/* Error header */}
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid hsl(var(--border-subtle) / 0.4)" }}
          >
            <AlertCircle className="w-4 h-4 text-destructive" strokeWidth={1.5} />
            <span
              className="text-sm font-medium"
              style={{ color: "hsl(var(--destructive))" }}
            >
              Analysis failed
            </span>
          </div>
          <div className="px-5 py-5 flex flex-col items-center">
            <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))", maxWidth: 280 }}>
              {error || "Something went wrong. Please try again."}
            </p>
            <Button variant="outline" size="sm" className="h-9 px-6 text-xs" onClick={onRetry}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 animate-fade-in">
      <div
        className="w-full max-w-md rounded-lg overflow-hidden"
        style={{
          border: "1px solid hsl(var(--border-subtle) / 0.6)",
          backgroundColor: "hsl(var(--card))",
        }}
      >
        {/* ── Header bar ── */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid hsl(var(--border-subtle) / 0.4)" }}
        >
          <div className="flex items-center gap-2.5">
            {/* Pulse indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: "hsl(var(--foreground) / 0.4)" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "hsl(var(--foreground) / 0.6)" }} />
            </span>
            <span
              className="text-[13px] font-medium"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Analyzing your mix
            </span>
          </div>
          <span
            className="tabular-nums"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: "hsl(var(--muted-foreground) / 0.5)",
              letterSpacing: "0.02em",
            }}
          >
            {formatElapsed(elapsed)}
          </span>
        </div>

        {/* ── Progress module ── */}
        <div className="px-5 pt-5 pb-4">
          {/* Percentage + status */}
          <div className="flex items-baseline justify-between mb-2">
            <span
              className="tabular-nums"
              style={{
                fontFamily: MONO,
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "hsl(var(--foreground))",
                lineHeight: 1,
              }}
            >
              {displayPercent}
              <span style={{ fontSize: 16, fontWeight: 500, color: "hsl(var(--muted-foreground) / 0.5)" }}>%</span>
            </span>
            <div className="h-4 flex items-center">
              {rotatingMessage ? (
                <p
                  key={rotatingMessage}
                  className="animate-fade-in"
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: "hsl(var(--muted-foreground) / 0.55)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {rotatingMessage}
                </p>
              ) : (
                <p style={{ fontFamily: MONO, fontSize: 10, color: "hsl(var(--muted-foreground) / 0.4)" }}>
                  Preparing…
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full overflow-hidden rounded-full"
            style={{
              height: 4,
              backgroundColor: "hsl(var(--border-subtle) / 0.5)",
            }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{
                width: `${displayPercent}%`,
                backgroundColor: "hsl(var(--foreground))",
              }}
            />
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, backgroundColor: "hsl(var(--border-subtle) / 0.3)", margin: "0 20px" }} />

        {/* ── Step checklist ── */}
        <div className="px-5 py-4">
          <div className="space-y-0.5">
            {steps.map((label, i) => {
              const isComplete = i < activeStep;
              const isActive = i === activeStep;
              return (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-all duration-300"
                  style={{
                    backgroundColor: isActive ? "hsl(var(--foreground) / 0.04)" : "transparent",
                  }}
                >
                  {/* Indicator */}
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isComplete ? (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "hsl(var(--foreground) / 0.10)" }}
                      >
                        <Check className="w-2.5 h-2.5" style={{ color: "hsl(var(--foreground) / 0.60)" }} strokeWidth={2.5} />
                      </div>
                    ) : isActive ? (
                      <span className="relative flex h-2 w-2">
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                          style={{ backgroundColor: "hsl(var(--foreground) / 0.5)" }}
                        />
                        <span
                          className="relative inline-flex rounded-full h-2 w-2"
                          style={{ backgroundColor: "hsl(var(--foreground) / 0.7)" }}
                        />
                      </span>
                    ) : (
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "hsl(var(--muted-foreground) / 0.25)" }}
                      />
                    )}
                  </div>

                  {/* Step number + label */}
                  <span
                    className="tabular-nums shrink-0"
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      fontWeight: 500,
                      color: isActive
                        ? "hsl(var(--foreground) / 0.45)"
                        : isComplete
                          ? "hsl(var(--foreground) / 0.30)"
                          : "hsl(var(--muted-foreground) / 0.25)",
                      letterSpacing: "0.04em",
                      width: 14,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[12px] transition-colors duration-300"
                    style={{
                      fontWeight: isActive ? 500 : 400,
                      color: isComplete
                        ? "hsl(var(--foreground) / 0.55)"
                        : isActive
                          ? "hsl(var(--foreground) / 0.90)"
                          : "hsl(var(--muted-foreground) / 0.40)",
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid hsl(var(--border-subtle) / 0.3)" }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: "hsl(var(--muted-foreground) / 0.40)",
              letterSpacing: "0.02em",
            }}
          >
            Usually completes in under 60s
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-[11px] font-medium transition-colors duration-100"
              style={{
                color: "hsl(var(--muted-foreground) / 0.50)",
                fontFamily: MONO,
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "hsl(var(--foreground) / 0.70)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "hsl(var(--muted-foreground) / 0.50)"}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgress;

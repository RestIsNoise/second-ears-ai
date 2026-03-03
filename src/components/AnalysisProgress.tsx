import { useEffect, useState, useRef, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  "Uploading track",
  "Reading audio",
  "Generating feedback",
  "Finalizing report",
];

const microStatuses = [
  "Checking dynamics",
  "Mapping low-end balance",
  "Evaluating stereo field",
  "Scanning transient detail",
  "Assessing tonal clarity",
  "Preparing final report",
];

const stepTargets = [18, 42, 82, 95];

const getActiveStep = (percent: number) => {
  if (percent <= 20) return 0;
  if (percent <= 45) return 1;
  if (percent <= 85) return 2;
  return 3;
};

const AnalyzingSubtitle = () => {
  const [dotCount, setDotCount] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const dotId = setInterval(() => setDotCount((c) => (c + 1) % 4), 500);
    const statusId = setInterval(() => setStatusIdx((c) => (c + 1) % microStatuses.length), 2800);
    return () => {
      clearInterval(dotId);
      clearInterval(statusId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center mb-5">
      <p className="text-[13px] text-muted-foreground motion-safe:animate-[subtle-pulse_2.4s_ease-in-out_infinite]">
        Analyzing your mix
        <span className="inline-block w-[1.2em] text-left">{".".repeat(dotCount)}</span>
      </p>
      <p
        key={statusIdx}
        className="text-[11px] text-muted-foreground/50 mt-2 motion-safe:animate-[fade-in_300ms_ease-out]"
      >
        {microStatuses[statusIdx]}
      </p>
    </div>
  );
};

/** Smooth progress interpolation using rAF with cubic easing */
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
      const target = targetPercent;
      // Ease toward target: move 4-8% of remaining distance per frame (~60fps)
      const speed = target >= 100 ? 0.12 : 0.04;
      const next = current + (target - current) * speed;

      // Snap when close enough
      const rounded = Math.round(next);
      if (rounded !== Math.round(current)) {
        displayRef.current = next;
        setDisplay(rounded);
      } else {
        displayRef.current = next;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetPercent, stopped]);

  return display;
}

/** Debounced remaining time that only moves downward smoothly */
function useStableRemaining(displayPercent: number) {
  const [stableRemaining, setStableRemaining] = useState<number | null>(null);
  const lastUpdateRef = useRef(0);
  const lastValueRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    // Update at most once per second
    if (now - lastUpdateRef.current < 1000) return;

    const estimatedTotal = 30;
    const raw = Math.max(0, Math.round(estimatedTotal * (1 - displayPercent / 100)));

    if (lastValueRef.current === null) {
      lastValueRef.current = raw;
      setStableRemaining(raw);
      lastUpdateRef.current = now;
      return;
    }

    // Only allow monotonic decrease (or small increases clamped to +1s max)
    const prev = lastValueRef.current;
    const clamped = raw > prev ? Math.min(raw, prev + 1) : raw;

    lastValueRef.current = clamped;
    setStableRemaining(clamped);
    lastUpdateRef.current = now;
  }, [displayPercent]);

  return stableRemaining;
}

interface AnalysisProgressProps {
  currentStep: number;
  error: string | null;
  onRetry: () => void;
  onCancel?: () => void;
}

const AnalysisProgress = ({ currentStep, error, onRetry, onCancel }: AnalysisProgressProps) => {
  // Target progress driven by backend steps, capped at 95% until done
  const targetPercent = error
    ? 0
    : stepTargets[Math.min(currentStep, 3)];

  const displayPercent = useSmoothedProgress(targetPercent, !!error);
  const stableRemaining = useStableRemaining(displayPercent);

  const activeStep = getActiveStep(displayPercent);

  // Format remaining time
  const remainingStr = (() => {
    if (stableRemaining === null || stableRemaining <= 0) return "";
    if (stableRemaining > 20) return `~about ${stableRemaining}s`;
    const remMin = Math.floor(stableRemaining / 60);
    const remSec = stableRemaining % 60;
    return remMin > 0
      ? `~${remMin}:${remSec.toString().padStart(2, "0")} remaining`
      : `~${remSec}s remaining`;
  })();

  // Ring geometry
  const ringSize = 84;
  const strokeWidth = 2;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (displayPercent / 100) * circumference;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 md:py-28 opacity-0 animate-[fade-in_200ms_ease-out_forwards]">
        <div className="w-[72px] h-[72px] md:w-[84px] md:h-[84px] rounded-full border border-muted-foreground/20 flex items-center justify-center mb-8">
          <AlertCircle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-foreground mb-1.5">Analysis failed</p>
        <p className="text-xs text-muted-foreground max-w-[260px] text-center mb-10 leading-relaxed">
          {error || "Something went wrong. Please try again."}
        </p>
        <Button
          variant="outline"
          size="lg"
          className="h-10 px-7 text-xs border-border-subtle hover:bg-secondary/50"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 md:py-28">
      {/* Subtle centered container */}
      <div className="w-full max-w-[340px] rounded-2xl border border-border-subtle/60 bg-background/50 px-8 py-10 flex flex-col items-center">
        {/* Primary: Circular progress ring */}
        <div className="relative w-[72px] h-[72px] md:w-[84px] md:h-[84px] mb-6">
          <svg
            className="w-full h-full -rotate-90"
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--border-subtle))"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono-brand text-[13px] md:text-[15px] font-medium text-foreground tabular-nums tracking-tight">
              {displayPercent}%
            </span>
          </div>
        </div>

        {/* Secondary: Subtitle + micro-status — 20px gap to steps */}
        <AnalyzingSubtitle />

        {/* Tertiary: Step timeline */}
        <div className="space-y-2 w-full max-w-[180px]">
          {steps.map((label, i) => {
            const isComplete = i < activeStep;
            const isActive = i === activeStep;

            return (
              <div key={label} className="flex items-center gap-2.5 h-[20px]">
                <div
                  className={`w-[5px] h-[5px] rounded-full shrink-0 transition-all duration-500 ${
                    isComplete
                      ? "bg-foreground/50"
                      : isActive
                      ? "bg-foreground"
                      : "bg-muted-foreground/25"
                  }`}
                />
                <span
                  className={`text-[12px] transition-colors duration-500 ${
                    isComplete
                      ? "text-foreground/50"
                      : isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ETA — 24px above cancel */}
        {remainingStr && (
          <p className="font-mono-brand text-[10px] text-muted-foreground/40 tabular-nums tracking-wide mt-6">
            {remainingStr}
          </p>
        )}

        {/* Cancel — ghost button, 14px below ETA */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-3.5 h-9 px-4 rounded-lg border border-border-subtle text-[11px] text-muted-foreground/70 tracking-wide transition-all duration-150 hover:border-foreground/20 hover:text-foreground/70 active:scale-[0.97]"
          >
            Cancel analysis
          </button>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgress;

import { useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Step 0→18 (upload), 1→25 (reading), 2→time-based crawl to 78, 3→95
const stepBaseTargets = [18, 25, 30, 95];

const getActiveStep = (percent: number) => {
  if (percent <= 20) return 0;
  if (percent <= 28) return 1;
  if (percent <= 88) return 2;
  return 3;
};

/** During step 2, crawl from 30→78% over ~25s using an ease-out curve */
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
      const duration = 25;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic: fast start, slow end — feels alive
      const eased = 1 - Math.pow(1 - t, 3);
      const crawlRange = 48; // 30% → 78%
      setCrawlPercent(Math.round(eased * crawlRange));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentStep]);

  return crawlPercent;
}

/** Rotating processing message */
function useRotatingMessage(active: boolean) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * processingMessages.length));

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setIdx((c) => (c + 1) % processingMessages.length);
    }, 4200);
    return () => clearInterval(id);
  }, [active]);

  return active ? processingMessages[idx] : null;
}

/** Smooth progress interpolation using rAF */
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
      const speed = targetPercent >= 95 ? 0.1 : 0.05;
      const next = current + (targetPercent - current) * speed;
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

/** Debounced remaining time */
function useStableRemaining(displayPercent: number) {
  const [stableRemaining, setStableRemaining] = useState<number | null>(null);
  const lastUpdateRef = useRef(0);
  const lastValueRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 1000) return;

    const estimatedTotal = 30;
    const raw = Math.max(0, Math.round(estimatedTotal * (1 - displayPercent / 100)));

    if (lastValueRef.current === null) {
      lastValueRef.current = raw;
      setStableRemaining(raw);
      lastUpdateRef.current = now;
      return;
    }

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
  const crawlPercent = useProcessingCrawl(currentStep);
  const isProcessing = currentStep === 2;
  const rotatingMessage = useRotatingMessage(isProcessing);

  // Compute target: base target + crawl addition during step 2
  const baseTarget = stepBaseTargets[Math.min(currentStep, 3)];
  const targetPercent = error ? 0 : currentStep === 2 ? baseTarget + crawlPercent : baseTarget;

  const displayPercent = useSmoothedProgress(targetPercent, !!error);
  const stableRemaining = useStableRemaining(displayPercent);
  const activeStep = getActiveStep(displayPercent);

  const remainingStr = (() => {
    if (stableRemaining === null || stableRemaining <= 0) return "";
    if (stableRemaining > 20) return `~${stableRemaining}s`;
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
      <div className="w-full max-w-[340px] rounded-2xl border border-border-subtle/60 bg-background/50 px-8 py-10 flex flex-col items-center">
        {/* Circular progress ring */}
        <div className="relative w-[72px] h-[72px] md:w-[84px] md:h-[84px] mb-6">
          <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none" stroke="hsl(var(--border-subtle))" strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none" stroke="hsl(var(--foreground))" strokeWidth={strokeWidth}
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeOffset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono-brand text-[13px] md:text-[15px] font-medium text-foreground tabular-nums tracking-tight">
              {displayPercent}%
            </span>
          </div>
        </div>

        {/* Subtitle + rotating message */}
        <div className="flex flex-col items-center mb-5">
          <p className="text-[13px] text-muted-foreground motion-safe:animate-[subtle-pulse_2.4s_ease-in-out_infinite]">
            Analyzing your mix
            <DotAnimation />
          </p>
          {rotatingMessage ? (
            <p
              key={rotatingMessage}
              className="text-[11px] text-muted-foreground/50 mt-2 motion-safe:animate-[fade-in_300ms_ease-out]"
            >
              {rotatingMessage}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/50 mt-2">Preparing…</p>
          )}
        </div>

        {/* Step timeline */}
        <div className="space-y-2 w-full max-w-[180px]">
          {steps.map((label, i) => {
            const isComplete = i < activeStep;
            const isActive = i === activeStep;
            return (
              <div key={label} className="flex items-center gap-2.5 h-[20px]">
                <div
                  className={`w-[5px] h-[5px] rounded-full shrink-0 transition-all duration-500 ${
                    isComplete ? "bg-foreground/50" : isActive ? "bg-foreground" : "bg-muted-foreground/25"
                  }`}
                />
                <span
                  className={`text-[12px] transition-colors duration-500 ${
                    isComplete ? "text-foreground/50" : isActive ? "text-foreground font-medium" : "text-muted-foreground/40"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {remainingStr && (
          <p className="font-mono-brand text-[10px] text-muted-foreground/40 tabular-nums tracking-wide mt-6">
            {remainingStr}
          </p>
        )}

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

/** Animated dots */
const DotAnimation = () => {
  const [dotCount, setDotCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDotCount((c) => (c + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-[1.2em] text-left">{".".repeat(dotCount)}</span>;
};

export default AnalysisProgress;

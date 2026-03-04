import { useEffect, useState, useRef } from "react";
import { AlertCircle, Check } from "lucide-react";
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

function useStableRemaining(displayPercent: number) {
  const [stable, setStable] = useState<number | null>(null);
  const lastUpdate = useRef(0);
  const lastValue = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current < 1200) return;
    const raw = Math.max(0, Math.round(30 * (1 - displayPercent / 100)));
    if (lastValue.current === null) {
      lastValue.current = raw;
      setStable(raw);
      lastUpdate.current = now;
      return;
    }
    const clamped = raw > lastValue.current ? Math.min(raw, lastValue.current + 1) : raw;
    lastValue.current = clamped;
    setStable(clamped);
    lastUpdate.current = now;
  }, [displayPercent]);

  return stable;
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

  const baseTarget = stepBaseTargets[Math.min(currentStep, 3)];
  const targetPercent = error ? 0 : currentStep === 2 ? baseTarget + crawlPercent : baseTarget;
  const displayPercent = useSmoothedProgress(targetPercent, !!error);
  const stableRemaining = useStableRemaining(displayPercent);
  const activeStep = getActiveStep(displayPercent);

  const remainingStr = (() => {
    if (stableRemaining === null || stableRemaining <= 0) return "";
    if (stableRemaining > 60) return `~${Math.ceil(stableRemaining / 60)}m remaining`;
    return `~${stableRemaining}s remaining`;
  })();

  // Ring geometry
  const ringSize = 88;
  const strokeWidth = 2.5;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (displayPercent / 100) * circumference;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 md:py-28 animate-fade-in">
        <div className="w-20 h-20 rounded-full border border-border-subtle flex items-center justify-center mb-7">
          <AlertCircle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-foreground mb-1.5">Analysis failed</p>
        <p className="text-xs text-muted-foreground max-w-[260px] text-center mb-8 leading-relaxed">
          {error || "Something went wrong. Please try again."}
        </p>
        <Button variant="outline" size="sm" className="h-9 px-6 text-xs" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-24 animate-fade-in">
      <div className="w-full max-w-[320px] rounded-2xl border border-border-subtle/60 bg-card/80 backdrop-blur-sm px-7 py-9 flex flex-col items-center">

        {/* Progress ring */}
        <div className="relative w-20 h-20 md:w-[88px] md:h-[88px] mb-5">
          <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none" stroke="hsl(var(--border-subtle))" strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none" stroke="hsl(var(--foreground))" strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-[stroke-dashoffset] duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono-brand text-sm md:text-[15px] font-medium text-foreground tabular-nums tracking-tight">
              {displayPercent}%
            </span>
          </div>
        </div>

        {/* Subtitle with pulse */}
        <div className="flex flex-col items-center mb-6">
          <p className="text-[13px] text-foreground/70 animate-[subtle-pulse_2.4s_ease-in-out_infinite]">
            Analyzing your mix
            <DotAnimation />
          </p>
          <div className="h-5 mt-1.5 flex items-center">
            {rotatingMessage ? (
              <p key={rotatingMessage} className="text-[11px] text-muted-foreground/60 animate-fade-in">
                {rotatingMessage}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">Preparing…</p>
            )}
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-1.5 w-full max-w-[200px] mb-5">
          {steps.map((label, i) => {
            const isComplete = i < activeStep;
            const isActive = i === activeStep;
            return (
              <div key={label} className="flex items-center gap-2.5 h-6">
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {isComplete ? (
                    <Check className="w-3 h-3 text-foreground/50" strokeWidth={2} />
                  ) : (
                    <div
                      className={`w-[5px] h-[5px] rounded-full transition-all duration-500 ${
                        isActive
                          ? "bg-foreground scale-110"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-[12px] leading-none transition-colors duration-500 ${
                    isComplete
                      ? "text-foreground/50"
                      : isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ETA */}
        {remainingStr && (
          <p className="font-mono-brand text-[10px] text-muted-foreground/40 tabular-nums tracking-wide mb-1">
            {remainingStr}
          </p>
        )}

        {/* Cancel */}
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mt-2 h-8 px-4 text-[11px] text-muted-foreground/60 hover:text-foreground/70 tracking-wide"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

const DotAnimation = () => {
  const [dotCount, setDotCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDotCount((c) => (c + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-[1.2em] text-left">{".".repeat(dotCount)}</span>;
};

export default AnalysisProgress;

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
      <div className="w-full max-w-[340px] rounded-2xl border border-border-subtle/60 bg-card/80 backdrop-blur-sm px-7 py-9 flex flex-col items-center">

        {/* Title + subtitle */}
        <div className="flex flex-col items-center mb-6 w-full">
          <p className="text-[13px] font-medium text-foreground mb-1">
            Analyzing your mix<DotAnimation />
          </p>
          <div className="h-4 flex items-center">
            {rotatingMessage ? (
              <p key={rotatingMessage} className="text-[11px] text-muted-foreground/60 animate-fade-in">
                {rotatingMessage}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">Preparing…</p>
            )}
          </div>
        </div>

        {/* Progress bar + percentage */}
        <div className="w-full flex items-center gap-3 mb-7">
          <div className="flex-1 h-[3px] rounded-full bg-border-subtle/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-out"
              style={{ width: `${displayPercent}%` }}
            />
          </div>
          <span
            className="text-foreground/70 tabular-nums shrink-0"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: "-0.01em",
              minWidth: 32,
              textAlign: "right",
            }}
          >
            {displayPercent}%
          </span>
        </div>

        {/* Step checklist */}
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

        {/* Cancel */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-1 h-[40px] px-5 text-[12px] font-medium text-foreground/55 rounded-[11px] border border-foreground/[0.18] bg-transparent hover:border-foreground/30 hover:bg-foreground/[0.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-150 tracking-wide"
          >
            Cancel analysis
          </button>
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

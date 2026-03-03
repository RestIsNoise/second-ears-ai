import { useEffect, useState, useRef } from "react";
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
    <div className="flex flex-col items-center mb-10 md:mb-12">
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

interface AnalysisProgressProps {
  currentStep: number;
  error: string | null;
  onRetry: () => void;
  onCancel?: () => void;
}

const AnalysisProgress = ({ currentStep, error, onRetry, onCancel }: AnalysisProgressProps) => {
  const [displayPercent, setDisplayPercent] = useState(5);
  const [elapsedSec, setElapsedSec] = useState(0);
  const animRef = useRef<number>();
  const startRef = useRef(Date.now());
  const startValRef = useRef(5);
  const mountRef = useRef(Date.now());

  const stepTargets = [18, 42, 82, 95];

  // Elapsed timer
  useEffect(() => {
    if (error) return;
    mountRef.current = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - mountRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [error]);

  useEffect(() => {
    if (error) return;

    const target = stepTargets[Math.min(currentStep, 3)];
    startRef.current = Date.now();
    startValRef.current = displayPercent;

    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const duration = 2200;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValRef.current + (target - startValRef.current) * eased;

      setDisplayPercent(Math.round(current));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentStep, error]);

  const activeStep = getActiveStep(displayPercent);

  // Estimate remaining: assume ~30s total, scale by progress
  const estimatedTotal = 30;
  const remaining = Math.max(0, Math.round(estimatedTotal * (1 - displayPercent / 100)));
  const remMin = Math.floor(remaining / 60);
  const remSec = remaining % 60;
  const remainingStr = remMin > 0
    ? `~${remMin}:${remSec.toString().padStart(2, "0")} remaining`
    : `~${remSec}s remaining`;

  // Ring
  const ringSize = 84;
  const strokeWidth = 2;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (displayPercent / 100) * circumference;
  const viewBox = ringSize;
  const center = ringSize / 2;

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
    <div className="flex flex-col items-center justify-center py-24 md:py-28 transition-opacity duration-200">
      {/* Circular progress ring */}
      <div className="relative w-[72px] h-[72px] md:w-[84px] md:h-[84px] mb-3">
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${viewBox} ${viewBox}`}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--border-subtle))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            style={{ transition: "stroke-dashoffset 400ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono-brand text-[13px] md:text-[15px] font-medium text-foreground tabular-nums tracking-tight">
            {displayPercent}%
          </span>
        </div>
      </div>

      {/* Estimated remaining */}
      <p
        className="font-mono-brand text-[10px] text-muted-foreground/45 tabular-nums tracking-wide mb-6"
      >
        {remainingStr}
      </p>

      {/* Subtitle + micro-status */}
      <AnalyzingSubtitle />

      {/* Step timeline */}
      <div className="space-y-2.5 w-full max-w-[180px]">
        {steps.map((label, i) => {
          const isComplete = i < activeStep;
          const isActive = i === activeStep;

          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`w-1 h-1 rounded-full shrink-0 transition-all duration-500 ${
                  isComplete
                    ? "bg-foreground"
                    : isActive
                    ? "bg-foreground"
                    : "bg-muted-foreground/40"
                }`}
              />
              <span
                className={`text-[12px] transition-colors duration-500 ${
                  isComplete
                    ? "text-muted-foreground/70"
                    : isActive
                    ? "text-foreground"
                    : "text-muted-foreground/45"
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
          className="mt-10 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        >
          Cancel analysis
        </button>
      )}
    </div>
  );
};

export default AnalysisProgress;

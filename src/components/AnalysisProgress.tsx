import { useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  "Uploading track",
  "Reading audio",
  "Generating feedback",
  "Finalizing report",
];

// Map progress % to active step
const getActiveStep = (percent: number) => {
  if (percent <= 20) return 0;
  if (percent <= 45) return 1;
  if (percent <= 85) return 2;
  return 3;
};

interface AnalysisProgressProps {
  currentStep: number; // 0-3 from parent
  error: string | null;
  onRetry: () => void;
}

const AnalysisProgress = ({ currentStep, error, onRetry }: AnalysisProgressProps) => {
  const [displayPercent, setDisplayPercent] = useState(5);
  const animRef = useRef<number>();
  const startRef = useRef(Date.now());
  const startValRef = useRef(5);
  const [visible, setVisible] = useState(true);

  const stepTargets = [18, 42, 82, 95];

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

  // Ring dimensions
  const ringSize = 84; // desktop
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
    <div
      className={`flex flex-col items-center justify-center py-24 md:py-28 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Circular progress ring */}
      <div className="relative w-[72px] h-[72px] md:w-[84px] md:h-[84px] mb-6">
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${viewBox} ${viewBox}`}
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--border-subtle))"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
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
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono-brand text-[13px] md:text-[15px] font-medium text-foreground tabular-nums tracking-tight">
            {displayPercent}%
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-[13px] text-muted-foreground mb-10 md:mb-12">
        Analyzing your mix
      </p>

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
                    : "bg-muted-foreground/25"
                }`}
              />
              <span
                className={`text-[12px] transition-colors duration-500 ${
                  isComplete
                    ? "text-muted-foreground"
                    : isActive
                    ? "text-foreground"
                    : "text-muted-foreground/35"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisProgress;

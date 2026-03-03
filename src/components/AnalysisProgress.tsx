import { useEffect, useState, useRef } from "react";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  "Uploading track",
  "Reading audio",
  "Generating feedback",
  "Finalizing report",
];

interface AnalysisProgressProps {
  currentStep: number; // 0-3
  error: string | null;
  onRetry: () => void;
}

const AnalysisProgress = ({ currentStep, error, onRetry }: AnalysisProgressProps) => {
  const [displayPercent, setDisplayPercent] = useState(0);
  const animRef = useRef<number>();
  const startRef = useRef(Date.now());

  // Target percentage based on step (0→15, 1→40, 2→75, 3→95)
  const stepTargets = [15, 40, 75, 95];

  useEffect(() => {
    if (error) return;

    const target = stepTargets[Math.min(currentStep, 3)];
    startRef.current = Date.now();
    const startVal = displayPercent;

    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      // Ease toward target over ~2s per step
      const duration = 2000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = startVal + (target - startVal) * eased;

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

  // Jump to 100 handled externally — parent sets step beyond 3

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (displayPercent / 100) * circumference;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-up">
        <div className="w-16 h-16 rounded-full border border-destructive/30 flex items-center justify-center mb-6">
          <AlertCircle className="w-7 h-7 text-destructive/70" />
        </div>
        <p className="text-sm font-medium text-foreground mb-2">Analysis failed</p>
        <p className="text-xs text-muted-foreground max-w-xs text-center mb-8 leading-relaxed">
          {error}
        </p>
        <Button variant="hero" size="lg" className="h-11 px-8 text-[13px]" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 animate-fade-up">
      {/* Circular progress */}
      <div className="relative w-32 h-32 mb-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="hsl(var(--border-subtle))"
            strokeWidth="3"
          />
          {/* Progress */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono-brand text-xl font-medium text-foreground tabular-nums">
            {displayPercent}%
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 w-full max-w-[220px]">
        {steps.map((label, i) => {
          const isComplete = i < currentStep;
          const isActive = i === currentStep;

          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isComplete
                    ? "bg-foreground"
                    : isActive
                    ? "border-2 border-foreground"
                    : "border border-border-subtle"
                }`}
              >
                {isComplete && <Check className="w-3 h-3 text-background" />}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
                )}
              </div>
              <span
                className={`text-[13px] transition-colors duration-300 ${
                  isComplete
                    ? "text-foreground"
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
    </div>
  );
};

export default AnalysisProgress;

import { useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const statusMessages = [
  "Uploading track...",
  "Running spectral analysis...",
  "Measuring loudness...",
  "Analyzing frequency balance...",
  "Generating feedback...",
  "Almost there...",
];

interface AnalysisProgressProps {
  currentStep: number;
  error: string | null;
  onRetry: () => void;
  onCancel?: () => void;
  trackName?: string;
}

const AnalysisProgress = ({ currentStep, error, onRetry, onCancel, trackName }: AnalysisProgressProps) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [started, setStarted] = useState(false);

  // Cycle status messages with fade
  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % statusMessages.length);
        setMsgVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, [error]);

  // Trigger bottom progress bar after mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (error) {
    return (
      <div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center"
        style={{ background: "hsl(0 0% 5.5%)" }}
      >
        <div
          className="w-full max-w-md rounded-lg overflow-hidden"
          style={{
            border: "1px solid hsl(0 0% 15%)",
            backgroundColor: "hsl(0 0% 9%)",
          }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid hsl(0 0% 15%)" }}
          >
            <AlertCircle className="w-4 h-4" style={{ color: "hsl(0 60% 55%)" }} strokeWidth={1.5} />
            <span className="text-sm font-medium" style={{ color: "hsl(0 60% 65%)" }}>
              Analysis failed
            </span>
          </div>
          <div className="px-5 py-5 flex flex-col items-center">
            <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: "hsl(0 0% 45%)", maxWidth: 280 }}>
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
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center"
      style={{ background: "hsl(0 0% 5.5%)" }}
    >
      {/* Track name */}
      {trackName && (
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "hsl(0 0% 40%)",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            marginBottom: 40,
          }}
        >
          {trackName}
        </p>
      )}

      {/* Pulsing bars */}
      <div className="flex items-center gap-[6px]" style={{ height: 48 }}>
        {[0, 150, 300, 450, 600].map((delay, i) => (
          <div
            key={i}
            style={{
              width: 3,
              borderRadius: 2,
              background: "hsl(48 10% 90%)",
              animation: `analysis-pulse 1.2s ease-in-out ${delay}ms infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Status message */}
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 14,
          color: "hsl(0 0% 53%)",
          textAlign: "center" as const,
          marginTop: 32,
          opacity: msgVisible ? 1 : 0,
          transition: "opacity 0.4s ease",
          minHeight: 20,
        }}
      >
        {statusMessages[msgIdx]}
      </p>

      {/* Cancel */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-10"
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "hsl(0 0% 30%)",
            letterSpacing: "0.04em",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(0 0% 55%)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(0 0% 30%)"; }}
        >
          Cancel
        </button>
      )}

      {/* Fixed bottom progress bar */}
      <div
        className="fixed bottom-0 left-0 right-0"
        style={{ height: 2, background: "hsl(0 0% 13%)" }}
      >
        <div
          style={{
            height: "100%",
            background: "hsl(48 10% 90%)",
            width: started ? "85%" : "0%",
            transition: "width 90s linear",
          }}
        />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes analysis-pulse {
          0% { height: 8px; }
          100% { height: 40px; }
        }
      `}</style>
    </div>
  );
};

export default AnalysisProgress;

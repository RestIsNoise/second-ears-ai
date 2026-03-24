import { useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const statusMessages = [
  "Measuring loudness...",
  "Analyzing frequency balance...",
  "Reading stereo image...",
  "Mapping dynamic range...",
  "Building your report...",
];

interface AnalysisProgressProps {
  currentStep: number;
  error: string | null;
  onRetry: () => void;
  onCancel?: () => void;
  trackName?: string;
  complete?: boolean;
}

const AnalysisProgress = ({ currentStep, error, onRetry, onCancel, trackName, complete }: AnalysisProgressProps) => {
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

  const barWidth = complete ? "100%" : started ? "85%" : "5%";
  const barTransition = complete
    ? "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
    : "width 90s cubic-bezier(0.1, 0, 0.3, 1)";

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center"
      style={{ background: "hsl(0 0% 5.5%)" }}
    >
      {/* Track name */}
      {trackName && (
        <p
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: "hsl(0 0% 40%)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          {trackName}
        </p>
      )}

      {/* Pulsing bars — 7 bars, 4px wide, 12–48px height range */}
      <div className="flex items-center gap-[6px]" style={{ height: 48 }}>
        {[0, 120, 240, 360, 480, 600, 720].map((delay, i) => (
          <div
            key={i}
            style={{
              width: 4,
              borderRadius: 2,
              background: "#e8e8e0",
              animation: `analysis-pulse 1.2s ease-in-out ${delay}ms infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Step counter */}
      <p
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: "#444",
          marginTop: 32,
          marginBottom: 8,
        }}
      >
        {msgIdx + 1} / {statusMessages.length}
      </p>

      {/* Status message */}
      <p
        style={{
          fontFamily: MONO,
          fontSize: 14,
          color: "hsl(0 0% 53%)",
          textAlign: "center",
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
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: "#444",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginTop: 24,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; }}
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
            background: "#e8e8e0",
            width: barWidth,
            transition: barTransition,
          }}
        />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes analysis-pulse {
          0% { height: 12px; }
          100% { height: 48px; }
        }
      `}</style>
    </div>
  );
};

export default AnalysisProgress;

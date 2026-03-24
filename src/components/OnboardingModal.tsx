import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "secondear-onboarding-seen";

const steps = [
  { num: 1, title: "Upload your track", desc: "Drop a WAV, MP3, or FLAC. No plugins needed." },
  { num: 2, title: "Choose a mode", desc: "Technical, Musical, or Perception — each listens differently." },
  { num: 3, title: "Get your fixes", desc: "Timestamped feedback with specific actions to take." },
];

interface Props {
  onClose: () => void;
}

const OnboardingModal = ({ onClose }: Props) => {
  const navigate = useNavigate();
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onClose();
  };

  const goAnalyze = () => {
    dismiss();
    navigate("/analyze");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: "calc(100vw - 32px)",
          background: isDark ? "#111" : "white",
          border: isDark ? "1px solid #222" : "1px solid #e0e0e0",
          borderRadius: 6,
          padding: 40,
          boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: isDark ? "#e8e8e0" : "hsl(0 0% 7%)",
            marginBottom: 6,
          }}
        >
          Welcome to SecondEar
        </h2>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            color: "#888",
            marginBottom: 28,
          }}
        >
          Here's how it works in 3 steps:
        </p>

        <div className="flex flex-col gap-5">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-4 items-start">
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: isDark ? "#e8e8e0" : "hsl(0 0% 7%)",
                  minWidth: 20,
                  lineHeight: "22px",
                }}
              >
                {s.num}.
              </span>
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isDark ? "#e8e8e0" : "hsl(0 0% 7%)",
                    marginBottom: 2,
                  }}
                >
                  {s.title}
                </p>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: isDark ? "#666" : "#888",
                    lineHeight: 1.5,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="default"
          className="w-full mt-8"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            letterSpacing: "0.06em",
            fontSize: 13,
          }}
          onClick={goAnalyze}
        >
          Start my first analysis →
        </Button>

        <button
          onClick={dismiss}
          className="block mx-auto mt-4 transition-colors"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: "#888",
            background: "none",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;

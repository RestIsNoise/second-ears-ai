import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { FeedbackResult } from "@/pages/Analyze";

const verdictColor: Record<string, string> = {
  "release-ready": "text-green-600",
  compelling: "text-green-600",
  ready: "text-green-600",
  "needs-work": "text-yellow-600",
  decent: "text-yellow-600",
  promising: "text-yellow-600",
  "major-issues": "text-red-500",
  flat: "text-red-500",
  "needs-rethinking": "text-red-500",
};

const modeLabels: Record<string, string> = {
  technical: "Technical",
  musical: "Musical",
  perception: "Perception",
};

const FeedbackDisplay = ({ result, onReset }: { result: FeedbackResult; onReset: () => void }) => {
  const { feedback, mode } = result;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> New analysis
        </Button>
        <span className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
          {modeLabels[mode]} mode
        </span>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border-subtle p-8 bg-secondary/30">
        <p className="text-lg font-medium tracking-tight leading-relaxed">{feedback.summary}</p>
        <p className={`font-mono-brand text-sm mt-4 uppercase tracking-wider font-medium ${verdictColor[feedback.verdict] || "text-foreground"}`}>
          {feedback.verdict?.replace(/-/g, " ")}
        </p>
      </div>

      {/* Scores */}
      {feedback.scores && Object.keys(feedback.scores).length > 0 && (
        <div>
          <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">Scores</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(feedback.scores).map(([key, score]) => (
              <div key={key} className="rounded-lg border border-border-subtle p-4 bg-background">
                <p className="text-2xl font-semibold tracking-tight">{score}<span className="text-sm text-muted-foreground">/10</span></p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{key.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {feedback.issues && feedback.issues.length > 0 && (
        <div>
          <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">Issues & fixes</p>
          <div className="space-y-3">
            {feedback.issues.map((issue, i) => (
              <div key={i} className="rounded-lg border border-border-subtle p-5 bg-background space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                  <p className="text-sm font-medium">{issue.area}</p>
                </div>
                <p className="text-sm text-muted-foreground">{issue.problem}</p>
                <p className="text-sm text-foreground/80">
                  <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">Fix</span>
                  {issue.fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;

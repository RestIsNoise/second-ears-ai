import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import WaveformPlayer from "@/components/WaveformPlayer";
import type { FeedbackResult } from "@/pages/Analyze";

const modeLabels: Record<string, string> = {
  technical: "Technical",
  musical: "Musical",
  perception: "Perception",
};

const FeedbackDisplay = ({
  result,
  onReset,
  audioUrl,
}: {
  result: FeedbackResult;
  onReset: () => void;
  audioUrl?: string;
}) => {
  const { feedback, mode } = result;

  return (
    <div className="space-y-16 animate-fade-up">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="gap-2 text-muted-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> New analysis
        </Button>

        <div className="space-y-2">
          {feedback.track_name && (
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {feedback.track_name}
            </h1>
          )}
          <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
            {modeLabels[mode]} analysis
          </p>
        </div>
      </div>

      {/* Waveform */}
      {audioUrl && (
        <WaveformPlayer
          audioUrl={audioUrl}
          markers={
            feedback.timestamps && feedback.timestamps.length > 0
              ? feedback.timestamps
              : [
                  { time: 12, label: "Low-mid congestion starts here" },
                  { time: 45, label: "Drop loses energy" },
                  { time: 80, label: "Stereo image collapses" },
                ]
          }
        />
      )}

      {/* Overall Impression */}
      {feedback.overall_impression && (
        <section>
          <p className="text-lg md:text-xl font-medium leading-relaxed tracking-tight max-w-xl">
            {feedback.overall_impression}
          </p>
        </section>
      )}

      {/* Top Priorities */}
      {feedback.top_priorities && feedback.top_priorities.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
            Top priorities
          </h2>
          <div className="space-y-4">
            {feedback.top_priorities.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-subtle p-8 bg-background"
              >
                <div className="flex items-start gap-6">
                  <span className="font-mono-brand text-2xl text-muted-foreground/40 font-medium leading-none pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.why}
                    </p>
                    <div className="pt-2">
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">
                          Fix
                        </span>
                        {item.fix}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What Works */}
      {feedback.what_works && feedback.what_works.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
            What works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedback.what_works.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-subtle p-8 bg-background"
              >
                <h3 className="text-base font-semibold tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fix One Thing */}
      {feedback.fix_one_thing && (
        <section className="space-y-6">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
            If you fix only one thing today
          </h2>
          <div className="rounded-xl border-2 border-foreground/10 p-10 bg-secondary/20">
            {feedback.fix_one_thing.how && !feedback.fix_one_thing.why ? (
              <p className="text-base text-foreground leading-relaxed">
                {feedback.fix_one_thing.how}
              </p>
            ) : (
              <>
                <h3 className="text-xl font-semibold tracking-tight mb-3">
                  {feedback.fix_one_thing.title}
                </h3>
                {feedback.fix_one_thing.why && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {feedback.fix_one_thing.why}
                  </p>
                )}
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">
                    How
                  </span>
                  {feedback.fix_one_thing.how}
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {/* Legacy fallback for old format */}
      {feedback.issues && feedback.issues.length > 0 && !feedback.top_priorities && (
        <section className="space-y-6">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
            Issues & fixes
          </h2>
          <div className="space-y-3">
            {feedback.issues.map((issue, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-subtle p-6 bg-background space-y-2"
              >
                <p className="text-sm font-medium">{issue.area}</p>
                <p className="text-sm text-muted-foreground">{issue.problem}</p>
                <p className="text-sm text-foreground/80">
                  <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">
                    Fix
                  </span>
                  {issue.fix}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FeedbackDisplay;

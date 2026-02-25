import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrackUploader from "@/components/TrackUploader";
import FeedbackDisplay from "@/components/FeedbackDisplay";

export type ListeningMode = "technical" | "musical" | "perception";

export interface FeedbackResult {
  feedback: {
    summary: string;
    scores: Record<string, number>;
    issues: Array<{ area: string; problem: string; fix: string }>;
    verdict: string;
  };
  mode: ListeningMode;
}

const Analyze = () => {
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">
              Upload & analyze
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Get your mix feedback
            </h1>
          </div>

          {!result ? (
            <TrackUploader
              onResult={setResult}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          ) : (
            <FeedbackDisplay result={result} onReset={() => setResult(null)} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analyze;

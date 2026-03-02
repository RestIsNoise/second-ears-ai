import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrackUploader from "@/components/TrackUploader";
import FeedbackDisplay from "@/components/FeedbackDisplay";

export type ListeningMode = "technical" | "musical" | "perception";

export interface TechnicalMetrics {
  integrated_lufs?: number;
  short_term_lufs?: number;
  dynamic_range?: number;
  peak_dbtp?: number;
  stereo_correlation?: number;
  crest_factor?: number;
}

export interface FullAnalysis {
  mixBalance?: string;
  dynamics?: string;
  stereoSpace?: string;
  frequencyBalance?: string;
}

export interface FeedbackData {
  track_name?: string;
  overallImpression?: string;
  overall_impression?: string;
  priorities?: Array<{ issue: string; why: string; fix: string }>;
  top_priorities?: Array<{ title: string; why: string; fix: string }>;
  whatWorks?: Array<{ title: string; detail: string }>;
  what_works?: Array<{ title: string; detail: string }>;
  fixOneThingToday?: { title: string; why: string; how: string };
  fix_one_thing?: { title: string; why: string; how: string };
  timestamps?: Array<{ time: number; label: string }>;
  technical_metrics?: TechnicalMetrics;
  fullAnalysis?: FullAnalysis;
  // Legacy fields
  summary?: string;
  scores?: Record<string, number>;
  issues?: Array<{ area: string; problem: string; fix: string }>;
  verdict?: string;
}

export interface FeedbackResult {
  feedback: FeedbackData;
  mode: ListeningMode;
  audioFile?: File;
  context?: string;
}

const Analyze = () => {
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-[72px] md:pb-[72px] px-6">
        <div className="max-w-2xl mx-auto">
          {!result ? (
            <>
              <div className="text-center mb-12">
                <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">
                  Upload & analyze
                </p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Get your mix feedback
                </h1>
              </div>
              <TrackUploader
                onResult={setResult}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            </>
          ) : (
            <FeedbackDisplay
              result={result}
              onReset={() => setResult(null)}
              audioFile={result.audioFile}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analyze;

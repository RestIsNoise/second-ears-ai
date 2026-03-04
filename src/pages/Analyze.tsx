import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrackUploader from "@/components/TrackUploader";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import AnalysisProgress from "@/components/AnalysisProgress";

export type ListeningMode = "technical" | "musical" | "perception";

export interface TechnicalMetrics {
  integrated_lufs?: number;
  short_term_lufs?: number;
  dynamic_range?: number;
  peak_dbtp?: number;
  stereo_correlation?: number;
  crest_factor?: number;
  sub_kick_ratio?: number;
}

export interface FullAnalysis {
  mixBalance?: string;
  dynamics?: string;
  stereoSpace?: string;
  frequencyBalance?: string;
  // Musical mode
  energyArc?: string;
  sectionContrast?: string;
  grooveContinuity?: string;
  hookClarity?: string;
  // Perception mode
  subLowTranslation?: string;
  headroomTransients?: string;
  stereoFoldDown?: string;
  listenerFatigue?: string;
}

export interface FeedbackData {
  track_name?: string;
  overallImpression?: string;
  overall_impression?: string;
  // Technical mode
  priorities?: Array<{ issue: string; whyItMatters: string; suggestedFix: string }>;
  top_priorities?: Array<{ title: string; why: string; fix: string }>;
  whatWorks?: Array<{ title: string; detail: string }>;
  what_works?: Array<{ title: string; detail: string }>;
  ifFixOneThing?: { title: string; why: string; how: string };
  fixOneThingToday?: { title: string; why: string; how: string };
  fix_one_thing?: { title: string; why: string; how: string };
  // Musical mode
  arrangementNotes?: Array<{ section: string; timestamp?: number; observation: string; suggestion: string }>;
  whatLands?: Array<{ title: string; detail?: string }>;
  focusHere?: { title: string; why: string; how: string };
  // Perception mode
  systemNotes?: Array<{ timestamp?: number; observation: string; translationRisk: string; fix: string }>;
  whatTranslates?: Array<{ title: string; detail?: string }>;
  urgentFix?: { title: string; why: string; how: string };
  // Shared
  timestamps?: Array<{ time: number; label: string }>;
  technical_metrics?: TechnicalMetrics;
  fullAnalysis?: FullAnalysis;
  focus_response?: string | null;
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
  const [progressStep, setProgressStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleRetry = () => {
    setAnalysisError(null);
    setIsAnalyzing(false);
    setProgressStep(0);
  };

  const handleStartAnalysis = (v: boolean) => {
    setIsAnalyzing(v);
    if (v) {
      setAnalysisError(null);
      setProgressStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-6 md:pb-10 px-6">
        <div className={result ? "max-w-6xl mx-auto" : "max-w-2xl mx-auto"}>
          {result ? (
            <FeedbackDisplay
              result={result}
              onReset={() => setResult(null)}
              audioFile={result.audioFile}
            />
          ) : isAnalyzing || analysisError ? (
            <AnalysisProgress
              currentStep={progressStep}
              error={analysisError}
              onRetry={handleRetry}
              onCancel={handleRetry}
            />
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
                  Upload & analyze
                </p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Get your mix feedback
                </h1>
              </div>
              <TrackUploader
                onResult={setResult}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={handleStartAnalysis}
                onProgressStep={setProgressStep}
                onError={(msg) => setAnalysisError(msg)}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analyze;

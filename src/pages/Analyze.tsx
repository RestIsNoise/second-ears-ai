import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrackUploader from "@/components/TrackUploader";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import AnalysisProgress from "@/components/AnalysisProgress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import type { NormalizedFeedback } from "@/lib/normalizeFeedback";

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
  energyArc?: string;
  sectionContrast?: string;
  grooveContinuity?: string;
  hookClarity?: string;
  subLowTranslation?: string;
  headroomTransients?: string;
  stereoFoldDown?: string;
  listenerFatigue?: string;
}

export interface FeedbackResult {
  normalized: NormalizedFeedback;
  audioFile?: File;
}

const Analyze = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

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

  const handleResult = async (feedbackResult: FeedbackResult) => {
    setResult(feedbackResult);

    // Auto-save to database
    if (user) {
      try {
        const n = feedbackResult.normalized;
        const { data: project, error: projErr } = await supabase
          .from("projects")
          .insert({ user_id: user.id, name: n.trackName })
          .select("id")
          .single();

        if (projErr) throw projErr;

        const { data: analysisRow, error: analysisErr } = await supabase.from("analyses").insert({
          project_id: project.id,
          mode: n.mode,
          feedback: {
            overallImpression: n.overallImpression,
            topIssue: n.topIssue,
            biggestWin: n.biggestWin,
            releaseStatus: n.releaseStatus,
            timelineItems: n.timelineItems,
            whatWorks: n.whatWorks,
            ifFixOneThing: n.ifFixOneThing,
            yourFocus: n.yourFocus,
            fullAnalysis: n.fullAnalysis,
          } as any,
          metrics: n.metrics as any,
        }).select("id").single();

        if (analysisErr) throw analysisErr;
        if (analysisRow) setSavedAnalysisId(analysisRow.id);
        console.log("[Analyze] Saved project:", project.id);
      } catch (err) {
        console.error("[Analyze] Failed to save analysis:", err);
      }
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-6 md:pb-10 px-6">
        <div className={result ? "max-w-6xl mx-auto" : "max-w-2xl mx-auto"}>
          {result ? (
            <FeedbackDisplay
              result={result}
              onReset={() => { setResult(null); setSavedAnalysisId(null); }}
              audioFile={result.audioFile}
              analysisId={savedAnalysisId}
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
                onResult={handleResult}
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

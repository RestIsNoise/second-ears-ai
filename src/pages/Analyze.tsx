import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  lra?: number;
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
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  // New-version params from URL
  const isNewVersion = searchParams.get("newVersion") === "true";
  const parentProjectId = searchParams.get("projectId");
  const parentAnalysisId = searchParams.get("parentAnalysisId");
  const prefillTrackName = searchParams.get("trackName");
  const prefillMode = searchParams.get("mode") as ListeningMode | null;
  const nextVersion = parseInt(searchParams.get("nextVersion") || "2", 10);

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

        let projectId: string;

        if (isNewVersion && parentProjectId) {
          // Re-use existing project for new version
          projectId = parentProjectId;
        } else {
          // Create new project
          const { data: project, error: projErr } = await supabase
            .from("projects")
            .insert({ user_id: user.id, name: n.trackName })
            .select("id")
            .single();
          if (projErr) throw projErr;
          projectId = project.id;
        }

        const insertPayload: any = {
          project_id: projectId,
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
          },
          metrics: n.metrics,
        };

        if (isNewVersion && parentAnalysisId) {
          insertPayload.parent_analysis_id = parentAnalysisId;
          insertPayload.version = nextVersion;
        }

        const { data: analysisRow, error: analysisErr } = await supabase
          .from("analyses")
          .insert(insertPayload)
          .select("id")
          .single();

        if (analysisErr) throw analysisErr;
        if (analysisRow) {
          setSavedAnalysisId(analysisRow.id);
          // If new version, navigate to project page to see version pills
          if (isNewVersion && parentProjectId) {
            navigate(`/project/${parentProjectId}?analysis=${analysisRow.id}`, { replace: true });
            return;
          }
        }
        console.log("[Analyze] Saved project:", projectId);
      } catch (err) {
        console.error("[Analyze] Failed to save analysis:", err);
      }
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={`pt-24 pb-6 md:pb-10 ${result ? "px-3 md:px-4" : "px-6"}`}>
        <div className={result ? "w-full" : "max-w-2xl mx-auto"}>
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
                  {isNewVersion ? "New version" : "Upload & analyze"}
                </p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {isNewVersion && prefillTrackName
                    ? `${prefillTrackName} — v${nextVersion}`
                    : "Get your mix feedback"}
                </h1>
              </div>
              <TrackUploader
                onResult={handleResult}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={handleStartAnalysis}
                onProgressStep={setProgressStep}
                onError={(msg) => setAnalysisError(msg)}
                defaultMode={prefillMode || undefined}
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

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompactFooter from "@/components/CompactFooter";
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
  rawResult?: any;
  audioFile?: File;
  storagePath?: string;
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
  const [analyzeTrackName, setAnalyzeTrackName] = useState<string | null>(null);

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
          projectId = parentProjectId;
        } else {
          const { data: project, error: projErr } = await supabase
            .from("projects")
            .insert({ user_id: user.id, name: n.trackName })
            .select("id")
            .single();
          if (projErr) {
            console.error("[Analyze] Project insert failed:", JSON.stringify(projErr));
            throw projErr;
          }
          projectId = project.id;
        }

        const insertPayload: any = {
          project_id: projectId,
          user_id: user.id,
          mode: n.mode,
          feedback: feedbackResult.rawResult ?? {},
          metrics: feedbackResult.rawResult?.technical_metrics ?? {},
          version: isNewVersion ? nextVersion : 1,
          storage_path: feedbackResult.storagePath ?? null,
        };

        if (isNewVersion && parentAnalysisId) {
          insertPayload.parent_analysis_id = parentAnalysisId;
        }

        const { data: analysisRow, error: analysisErr } = await supabase
          .from("analyses")
          .insert(insertPayload)
          .select("id")
          .single();

        if (analysisErr) {
          console.error("[Analyze] Analysis insert failed:", JSON.stringify(analysisErr, null, 2));
          throw analysisErr;
        }
        if (analysisRow) {
          setSavedAnalysisId(analysisRow.id);
          if (isNewVersion && parentProjectId) {
            navigate(`/project/${parentProjectId}?analysis=${analysisRow.id}`, { replace: true });
            return;
          }
        }
        console.log("[Analyze] Analysis saved:", analysisRow?.id);
      } catch (err) {
        console.error("[Analyze] Failed to save analysis:", err);
      }
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Noise grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          opacity: 0.03,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "512px 512px",
        }}
        aria-hidden="true"
      />
      <Header />
      <main className={`pt-18 sm:pt-24 pb-6 md:pb-12 ${result ? "px-2 sm:px-4 md:px-5" : "px-4 sm:px-6"}`}>
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
              trackName={analyzeTrackName || undefined}
            />
          ) : (
            <>
              <div className="text-center mb-10">
                <p
                  className="text-[10px] tracking-[0.18em] uppercase mb-3"
                  style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace", color: "#999" }}
                >
                  {isNewVersion ? "New version" : "Upload & analyze"}
                </p>
                <h1 className="text-foreground" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {isNewVersion && prefillTrackName
                    ? `${prefillTrackName} — v${nextVersion}`
                    : "Get your mix feedback"}
                </h1>
                {!isNewVersion && (
                  <p style={{ fontSize: 15, color: "#666", marginTop: 8, lineHeight: 1.5 }}>
                    Upload a track and get a prioritized fix plan in minutes.
                  </p>
                )}
              </div>

              <TrackUploader
                key={result ? "post-result" : "fresh"}
                onResult={handleResult}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={handleStartAnalysis}
                onProgressStep={setProgressStep}
                onError={(msg) => setAnalysisError(msg)}
                defaultMode={prefillMode || undefined}
                onTrackName={(name) => setAnalyzeTrackName(name)}
              />
            </>
          )}
        </div>
      </main>
      {!result && <Footer />}
    </div>
  );
};

export default Analyze;

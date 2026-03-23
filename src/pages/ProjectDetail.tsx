import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import NewVersionModal from "@/components/NewVersionModal";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import type { FeedbackResult } from "@/pages/Analyze";
import type { VersionInfo } from "@/components/VersionPills";
import { ArrowLeft, Plus, CheckCircle2, Circle, Eye, Activity, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const modeColors: Record<string, { bg: string; text: string }> = {
  technical: { bg: "hsl(35 50% 52% / 0.12)", text: "hsl(35 50% 45%)" },
  musical: { bg: "hsl(215 40% 52% / 0.12)", text: "hsl(215 40% 45%)" },
  perception: { bg: "hsl(280 35% 52% / 0.12)", text: "hsl(280 35% 45%)" },
};

interface AnalysisRow {
  id: string;
  mode: string;
  feedback: any;
  metrics: any;
  version: number;
  created_at: string;
  storage_path: string | null;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedAnalysisId = searchParams.get("analysis");

  const [projectName, setProjectName] = useState("");
  const [allAnalyses, setAllAnalyses] = useState<AnalysisRow[]>([]);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Whether to show the version list view or the feedback view
  const showFeedback = !!requestedAnalysisId;

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const loadProject = useCallback(async () => {
    if (!user || !id) return;
    setFetching(true);
    setAudioFile(null);

    const { data: proj } = await supabase
      .from("projects")
      .select("name")
      .eq("id", id)
      .single();

    if (proj) setProjectName(proj.name);

    const { data: analyses } = await supabase
      .from("analyses")
      .select("id, mode, feedback, metrics, version, created_at, storage_path")
      .eq("project_id", id)
      .order("version", { ascending: true });

    if (analyses) {
      setAllAnalyses(analyses);
      const versionList: VersionInfo[] = analyses.map((a) => ({
        analysisId: a.id,
        version: a.version,
        projectId: id,
      }));
      setVersions(versionList);

      // If a specific analysis is requested, load it
      if (requestedAnalysisId) {
        const target = analyses.find((a) => a.id === requestedAnalysisId) || analyses[analyses.length - 1];
        if (target) {
          setAnalysisId(target.id);
          const feedbackData = {
            ...(typeof target.feedback === "object" ? target.feedback : {}),
            technical_metrics: typeof target.metrics === "object" ? target.metrics : {},
          };
          const normalized = normalizeFeedbackResponse(
            feedbackData,
            target.mode as any,
            undefined,
            proj?.name || "",
          );
          setResult({ normalized });

          // Fetch audio file from storage if available
          if (target.storage_path) {
            try {
              const { data: blob } = await supabase.storage
                .from("tracks")
                .download(target.storage_path);
              if (blob) {
                const fileName = target.storage_path.replace(/^\d+-/, "");
                const file = new File([blob], fileName, { type: blob.type || "audio/mpeg" });
                setAudioFile(file);
              }
            } catch (err) {
              console.warn("[ProjectDetail] Failed to load audio:", err);
            }
          }
        }
      }
    }
    setFetching(false);
  }, [user, id, requestedAnalysisId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleAnalyzeVersion = (version: number) => {
    // Navigate to analyze page with new-version params
    const latestAnalysis = allAnalyses[0];
    const params = new URLSearchParams({
      newVersion: "true",
      projectId: id!,
      trackName: projectName,
      mode: latestAnalysis?.mode || "technical",
      parentAnalysisId: latestAnalysis?.id || "",
      nextVersion: String(version),
    });
    navigate(`/analyze?${params.toString()}`);
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 px-6 text-center text-muted-foreground text-sm">Loading…</main>
      </div>
    );
  }

  // ═══ FEEDBACK VIEW ═══
  if (showFeedback && result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-6 md:pb-10 px-3 md:px-4">
          <div className="w-full">
            <FeedbackDisplay
              result={result}
              onReset={() => navigate(`/project/${id}`)}
              audioFile={audioFile || undefined}
              analysisId={analysisId}
              versions={versions}
              projectId={id || null}
            />
          </div>
        </main>
      </div>
    );
  }

  // ═══ VERSION LIST VIEW ═══
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-6">
        <div className="mx-auto" style={{ maxWidth: 760, padding: "40px 24px" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2 text-muted-foreground mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>

          <div className="flex items-start justify-between mb-10">
            <div>
              <h1
                className="text-foreground leading-tight"
                style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                {projectName}
              </h1>
              <p
                className="text-muted-foreground/45 uppercase mt-1.5"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", fontWeight: 500 }}
              >
                {allAnalyses.length} version{allAnalyses.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowVersionModal(true)}
              className="flex items-center gap-2 shrink-0 font-medium transition-opacity hover:opacity-80"
              style={{
                background: "hsl(0 0% 7%)",
                color: "hsl(0 0% 100%)",
                padding: "10px 20px",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              <Plus className="w-4 h-4" />
              New version
            </button>
          </div>

          {/* Version list */}
          <div className="space-y-3">
            {allAnalyses.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 rounded-xl"
                style={{ border: "1px dashed hsl(0 0% 0% / 0.12)" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "hsl(var(--secondary))" }}
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">No versions yet</p>
                <p className="text-[12px] text-muted-foreground/50 mb-5">Upload your first track to get started.</p>
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="flex items-center gap-2 font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: "hsl(0 0% 7%)",
                    color: "hsl(0 0% 100%)",
                    padding: "10px 20px",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  <Plus className="w-4 h-4" /> Upload first version
                </button>
              </div>
            ) : (
              allAnalyses.map((a) => {
                const hasAnalysis = a.feedback && typeof a.feedback === "object" && Object.keys(a.feedback).length > 0;
                const timeAgo = formatDistanceToNow(new Date(a.created_at), { addSuffix: true });
                const colors = modeColors[a.mode] || modeColors.technical;

                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 transition-shadow hover:shadow-md"
                    style={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(0 0% 91%)",
                      borderRadius: 8,
                      padding: "20px 24px",
                    }}
                  >
                    {/* Version pill */}
                    <span
                      className="shrink-0 flex items-center justify-center uppercase"
                      style={{
                        background: "hsl(0 0% 7%)",
                        color: "hsl(0 0% 100%)",
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 4,
                        fontFamily: MONO,
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                      }}
                    >
                      V{a.version}
                    </span>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate" style={{ fontSize: 14, fontWeight: 600 }}>
                        {projectName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span
                          className="uppercase"
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            letterSpacing: "0.06em",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 3,
                            backgroundColor: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {a.mode}
                        </span>
                      </div>
                    </div>

                    {/* Status + action */}
                    <div className="flex items-center gap-3 shrink-0">
                      {hasAnalysis ? (
                        <>
                          <span
                            className="inline-flex items-center gap-1"
                            style={{
                              fontSize: 10,
                              fontFamily: MONO,
                              fontWeight: 600,
                              color: "hsl(145 55% 40%)",
                              backgroundColor: "hsl(145 55% 45% / 0.1)",
                              padding: "3px 8px",
                              borderRadius: 3,
                              letterSpacing: "0.04em",
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Analyzed
                          </span>
                          <button
                            onClick={() => navigate(`/project/${id}?analysis=${a.id}`)}
                            className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-80"
                            style={{
                              background: "hsl(0 0% 7%)",
                              color: "hsl(0 0% 100%)",
                              padding: "7px 14px",
                              borderRadius: 5,
                              fontSize: 12,
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            View feedback
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className="inline-flex items-center gap-1 text-muted-foreground/50"
                            style={{ fontSize: 10, fontFamily: MONO }}
                          >
                            <Circle className="w-3.5 h-3.5" />
                            Not analyzed
                          </span>
                          <button
                            onClick={() => handleAnalyzeVersion(a.version)}
                            className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-80"
                            style={{
                              background: "hsl(0 0% 7%)",
                              color: "hsl(0 0% 100%)",
                              padding: "7px 14px",
                              borderRadius: 5,
                              fontSize: 12,
                            }}
                          >
                            <Activity className="w-3 h-3" />
                            Get SecondEar Notes
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />

      <NewVersionModal
        open={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        projectId={id!}
        trackName={projectName}
        currentAnalysisId={analysisId ?? allAnalyses[allAnalyses.length - 1]?.id}
        nextVersion={allAnalyses.length > 0 ? Math.max(...allAnalyses.map(a => a.version)) + 1 : 2}
        mode={allAnalyses[allAnalyses.length - 1]?.mode}
      />
    </div>
  );
};

export default ProjectDetail;

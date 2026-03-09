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
import { ArrowLeft, Plus, CheckCircle2, Circle, Eye, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

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
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2 text-muted-foreground mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {projectName}
              </h1>
              <p
                className="text-[10px] text-muted-foreground/45 tracking-[0.14em] uppercase mt-1"
                style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
              >
                {allAnalyses.length} version{allAnalyses.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVersionModal(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New version
            </Button>
          </div>

          {/* Version list */}
          <div className="space-y-2">
            {allAnalyses.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm mb-4">No versions yet</p>
                <Button onClick={() => setShowVersionModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Upload first version
                </Button>
              </div>
            ) : (
              allAnalyses.map((a) => {
                const hasAnalysis = a.feedback && typeof a.feedback === "object" && Object.keys(a.feedback).length > 0;
                const timeAgo = formatDistanceToNow(new Date(a.created_at), { addSuffix: true });

                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 rounded-lg border border-border/60 bg-card/40 px-5 py-4 hover:bg-card/70 transition-colors"
                  >
                    {/* Version badge */}
                    <span className="shrink-0 w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center text-sm font-bold text-foreground/80">
                      v{a.version}
                    </span>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{projectName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span
                          className="text-[10px] uppercase tracking-wider text-muted-foreground/50"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {a.mode}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 shrink-0">
                      {hasAnalysis ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary/70">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Analyzed
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => navigate(`/project/${id}?analysis=${a.id}`)}
                          >
                            <Eye className="w-3 h-3" />
                            View feedback
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50">
                            <Circle className="w-3.5 h-3.5" />
                            Not analyzed
                          </span>
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleAnalyzeVersion(a.version)}
                          >
                            <Activity className="w-3 h-3" />
                            Get AI Feedback
                          </Button>
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
        onVersionCreated={loadProject}
      />
    </div>
  );
};

export default ProjectDetail;

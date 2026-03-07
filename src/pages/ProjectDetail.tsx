import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import type { FeedbackResult } from "@/pages/Analyze";
import type { VersionInfo } from "@/components/VersionPills";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedAnalysisId = searchParams.get("analysis");

  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const { data: proj } = await supabase
        .from("projects")
        .select("name")
        .eq("id", id)
        .single();

      // Fetch ALL analyses for this project to build version list
      const { data: allAnalyses } = await supabase
        .from("analyses")
        .select("id, mode, feedback, metrics, version")
        .eq("project_id", id)
        .order("version", { ascending: true });

      if (proj && allAnalyses && allAnalyses.length > 0) {
        // Build version list
        const versionList: VersionInfo[] = allAnalyses.map((a) => ({
          analysisId: a.id,
          version: a.version,
          projectId: id,
        }));
        setVersions(versionList);

        // Pick the requested analysis or the latest
        const target = requestedAnalysisId
          ? allAnalyses.find((a) => a.id === requestedAnalysisId) || allAnalyses[allAnalyses.length - 1]
          : allAnalyses[allAnalyses.length - 1];

        setAnalysisId(target.id);
        const feedbackData = {
          ...(typeof target.feedback === "object" ? target.feedback : {}),
          technical_metrics: typeof target.metrics === "object" ? target.metrics : {},
        };
        const normalized = normalizeFeedbackResponse(
          feedbackData,
          target.mode as any,
          undefined,
          proj.name,
        );
        setResult({ normalized });
      }
      setFetching(false);
    };
    load();
  }, [user, id, requestedAnalysisId]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 px-6 text-center text-muted-foreground text-sm">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-6 md:pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          {result ? (
            <FeedbackDisplay
              result={result}
              onReset={() => navigate("/dashboard")}
              analysisId={analysisId}
              versions={versions}
              projectId={id || null}
            />
          ) : (
            <p className="text-center text-muted-foreground text-sm">Project not found.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetail;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import type { FeedbackResult } from "@/pages/Analyze";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
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

      const { data: analysis } = await supabase
        .from("analyses")
        .select("id, mode, feedback, metrics")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (proj && analysis) {
        setAnalysisId(analysis.id);
        const feedbackData = {
          ...(typeof analysis.feedback === "object" ? analysis.feedback : {}),
          technical_metrics: typeof analysis.metrics === "object" ? analysis.metrics : {},
        };
        const normalized = normalizeFeedbackResponse(
          feedbackData,
          analysis.mode as any,
          undefined,
          proj.name,
        );
        setResult({ normalized });
      }
      setFetching(false);
    };
    load();
  }, [user, id]);

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

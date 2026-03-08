import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import type { FeedbackResult } from "@/pages/Analyze";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const SharedView = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [accessLevel, setAccessLevel] = useState<"owner" | "editor" | "viewer" | "public" | "none">("none");

  useEffect(() => {
    if (authLoading) return;
    if (!id) { setFetching(false); return; }

    const load = async () => {
      // Try to load the analysis
      const { data: analysis } = await supabase
        .from("analyses")
        .select("id, mode, feedback, metrics, is_public, project_id")
        .eq("id", id)
        .single();

      if (!analysis) {
        setFetching(false);
        return;
      }

      // Determine access level
      let access: typeof accessLevel = "none";

      if (user) {
        // Check if owner
        const { data: proj } = await supabase
          .from("projects")
          .select("name, user_id")
          .eq("id", analysis.project_id)
          .single();

        if (proj?.user_id === user.id) {
          access = "owner";
        } else {
          // Check collaborator status
          const { data: collab } = await supabase
            .from("collaborators")
            .select("role")
            .eq("analysis_id", id)
            .or(`user_id.eq.${user.id},invited_email.eq.${user.email}`)
            .limit(1)
            .single();

          if (collab) {
            access = collab.role as "viewer" | "editor";
          } else if (analysis.is_public) {
            access = "public";
          }
        }

        if (access !== "none") {
          const { data: proj } = await supabase
            .from("projects")
            .select("name")
            .eq("id", analysis.project_id)
            .single();

          const feedbackData = {
            ...(typeof analysis.feedback === "object" ? analysis.feedback : {}),
            technical_metrics: typeof analysis.metrics === "object" ? analysis.metrics : {},
          };
          const normalized = normalizeFeedbackResponse(
            feedbackData,
            analysis.mode as any,
            undefined,
            proj?.name || "Shared Track",
          );
          setResult({ normalized });
          setAnalysisId(analysis.id);
        }
      } else if (analysis.is_public) {
        access = "public";
        const { data: proj } = await supabase
          .from("projects")
          .select("name")
          .eq("id", analysis.project_id)
          .single();

        const feedbackData = {
          ...(typeof analysis.feedback === "object" ? analysis.feedback : {}),
          technical_metrics: typeof analysis.metrics === "object" ? analysis.metrics : {},
        };
        const normalized = normalizeFeedbackResponse(
          feedbackData,
          analysis.mode as any,
          undefined,
          proj?.name || "Shared Track",
        );
        setResult({ normalized });
        setAnalysisId(analysis.id);
      }

      setAccessLevel(access);
      setFetching(false);
    };
    load();
  }, [id, user, authLoading]);

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 px-6 text-center text-muted-foreground text-sm">Loading…</main>
      </div>
    );
  }

  if (accessLevel === "none" || !result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 px-6 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            {user ? "You don't have access to this analysis." : "This analysis is private."}
          </p>
          {!user && (
            <Link to="/auth">
              <Button variant="hero" size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Sign up to view and comment
              </Button>
            </Link>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-6 md:pb-10 px-3 md:px-4">
        <div className="w-full">
          {/* Sign-up banner for unauthenticated public viewers */}
          {!user && accessLevel === "public" && (
            <div className="mb-6 rounded-xl border border-border-subtle bg-secondary/30 p-4 flex items-center justify-between">
              <p className="text-sm text-foreground/70">
                Sign up to add comments and collaborate on this analysis
              </p>
              <Link to="/auth">
                <Button variant="hero" size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign up free
                </Button>
              </Link>
            </div>
          )}

          <FeedbackDisplay
            result={result}
            onReset={() => window.history.back()}
            analysisId={analysisId}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SharedView;

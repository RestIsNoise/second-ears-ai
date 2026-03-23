import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import type { FeedbackResult } from "@/pages/Analyze";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const MONO = "'IBM Plex Mono', monospace";

const SharedHeader = () => (
  <header
    style={{
      background: "hsl(0 0% 7%)",
      padding: "16px 32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.15em",
        color: "white",
        textTransform: "uppercase" as const,
      }}
    >
      SecondEar
    </span>
    <span
      style={{
        fontSize: 13,
        color: "white",
        opacity: 0.6,
        position: "absolute" as const,
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      Shared Analysis
    </span>
    <a
      href="https://secondear.app/analyze"
      style={{
        background: "white",
        color: "hsl(0 0% 7%)",
        padding: "8px 16px",
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      Analyze your mix →
    </a>
  </header>
);

const SharedFooter = () => (
  <footer
    style={{
      textAlign: "center" as const,
      padding: 24,
      fontSize: 12,
      color: "hsl(0 0% 60%)",
      fontFamily: MONO,
    }}
  >
    Analysis powered by{" "}
    <a
      href="https://secondear.app"
      style={{ color: "hsl(0 0% 40%)", textDecoration: "underline" }}
    >
      SecondEar
    </a>{" "}
    · secondear.app
  </footer>
);

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
      const { data: analysis } = await supabase
        .from("analyses")
        .select("id, mode, feedback, metrics, is_public, project_id")
        .eq("id", id)
        .single();

      if (!analysis) { setFetching(false); return; }

      let access: typeof accessLevel = "none";

      if (user) {
        const { data: proj } = await supabase
          .from("projects")
          .select("name, user_id")
          .eq("id", analysis.project_id)
          .single();

        if (proj?.user_id === user.id) {
          access = "owner";
        } else {
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
          const { data: proj2 } = await supabase
            .from("projects")
            .select("name")
            .eq("id", analysis.project_id)
            .single();

          const feedbackData = {
            ...(typeof analysis.feedback === "object" ? analysis.feedback : {}),
            technical_metrics: typeof analysis.metrics === "object" ? analysis.metrics : {},
          };
          const normalized = normalizeFeedbackResponse(
            feedbackData, analysis.mode as any, undefined, proj2?.name || "Shared Track",
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
          feedbackData, analysis.mode as any, undefined, proj?.name || "Shared Track",
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
        <SharedHeader />
        <main className="pt-24 pb-16 px-6 text-center text-muted-foreground text-sm">Loading…</main>
      </div>
    );
  }

  if (accessLevel === "none" || !result) {
    return (
      <div className="min-h-screen bg-background">
        <SharedHeader />
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
        <SharedFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SharedHeader />
      <main className="flex-1 pt-6 pb-6 md:pb-10 px-3 md:px-4">
        <div className="w-full">
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
      <SharedFooter />
    </div>
  );
};

export default SharedView;

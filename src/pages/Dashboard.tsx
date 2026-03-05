import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Activity, Music, Eye, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const modeIcons: Record<string, typeof Activity> = {
  technical: Activity,
  musical: Music,
  perception: Eye,
};

interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
  analyses: {
    id: string;
    mode: string;
    feedback: any;
    created_at: string;
  }[];
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, created_at, analyses(id, mode, feedback, created_at)")
        .order("created_at", { ascending: false });
      setProjects((data as unknown as ProjectRow[]) || []);
      setFetching(false);
    };
    load();
  }, [user]);

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
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-1">Dashboard</p>
              <h1 className="text-2xl font-semibold tracking-tight">My Projects</h1>
            </div>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/85 transition-all"
            >
              New analysis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-sm">No analyses yet.</p>
              <p className="text-xs mt-1">Upload a track to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj) => {
                const analysis = proj.analyses[0];
                const ModeIcon = analysis ? modeIcons[analysis.mode] || Activity : Activity;
                const impression =
                  analysis?.feedback?.overallImpression ||
                  analysis?.feedback?.overall_impression ||
                  "";
                const preview = impression.length > 120 ? impression.slice(0, 120) + "…" : impression;

                return (
                  <Link
                    key={proj.id}
                    to={`/project/${proj.id}`}
                    className="group rounded-xl border border-border-subtle bg-card p-5 hover:border-foreground/15 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <ModeIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="font-mono-brand text-[10px] text-muted-foreground uppercase">
                        {analysis?.mode || "—"}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium mb-1 group-hover:text-foreground/80 transition-colors">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{preview || "No preview"}</p>
                    <p className="font-mono-brand text-[10px] text-muted-foreground/60">
                      {format(new Date(proj.created_at), "MMM d, yyyy")}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;

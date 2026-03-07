import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Activity, Music, Eye, ArrowRight, MoreVertical, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const modeIcons: Record<string, typeof Activity> = {
  technical: Activity,
  musical: Music,
  perception: Eye,
};

const modeColors: Record<string, string> = {
  technical: "bg-accent text-accent-foreground",
  musical: "bg-blue-500/15 text-blue-400",
  perception: "bg-purple-500/15 text-purple-400",
};

interface AnalysisRow {
  id: string;
  mode: string;
  feedback: any;
  created_at: string;
  version: number;
}

interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
  analyses: AnalysisRow[];
}

/** Grouped display item — one per track, showing latest version */
interface GroupedProject {
  project: ProjectRow;
  latestAnalysis: AnalysisRow;
  versionCount: number;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, created_at, analyses(id, mode, feedback, created_at, version)")
        .order("created_at", { ascending: false });
      setProjects((data as unknown as ProjectRow[]) || []);
      setFetching(false);
    };
    load();
  }, [user]);

  // Group: one card per project, show latest version
  const grouped: GroupedProject[] = projects
    .filter((p) => p.analyses.length > 0)
    .map((proj) => {
      const sorted = [...proj.analyses].sort((a, b) => b.version - a.version);
      return {
        project: proj,
        latestAnalysis: sorted[0],
        versionCount: sorted.length,
      };
    });

  const handleDeleteClick = (e: React.MouseEvent, project: ProjectRow) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);

    try {
      const projectId = projectToDelete.id;
      await supabase.from("analyses").delete().eq("project_id", projectId);
      const { error } = await supabase.from("projects").delete().eq("id", projectId);

      if (error) {
        toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
        return;
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({ title: "Deleted", description: "Project removed." });
      setProjectToDelete(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

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
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => { if (!open && !deleting) setProjectToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{projectToDelete?.name}</strong> and all its analyses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

          {grouped.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-sm">No analyses yet.</p>
              <p className="text-xs mt-1">Upload a track to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.map(({ project: proj, latestAnalysis, versionCount }) => {
                const mode = latestAnalysis.mode || "technical";
                const ModeIcon = modeIcons[mode] || Activity;
                const colorClass = modeColors[mode] || modeColors.technical;
                const impression =
                  latestAnalysis.feedback?.overallImpression ||
                  latestAnalysis.feedback?.overall_impression ||
                  "";
                const preview = impression.length > 120 ? impression.slice(0, 120) + "…" : impression;

                return (
                  <Link
                    key={proj.id}
                    to={`/project/${proj.id}`}
                    className="group relative rounded-xl border border-border-subtle bg-card p-5 hover:border-foreground/15 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}>
                          <ModeIcon className="w-3 h-3" />
                          {mode}
                        </span>
                        {versionCount > 1 && (
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            v{latestAnalysis.version}
                          </span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => handleDeleteClick(e, proj)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

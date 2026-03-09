import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, Music, Eye, ArrowRight, MoreVertical, Trash2, AudioLines, Inbox, Archive, List, LayoutGrid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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

interface GroupedProject {
  project: ProjectRow;
  latestAnalysis: AnalysisRow;
  versionCount: number;
  lastUpdated: string;
}

/* ─── Track Card ─── */
const TrackCard = ({
  grouped,
  onDelete,
}: {
  grouped: GroupedProject;
  onDelete: (e: React.MouseEvent, p: ProjectRow) => void;
}) => {
  const { project: proj, latestAnalysis, versionCount, lastUpdated } = grouped;
  const mode = latestAnalysis.mode || "technical";
  const ModeIcon = modeIcons[mode] || Activity;
  const colorClass = modeColors[mode] || modeColors.technical;

  return (
    <Link
      to={`/project/${proj.id}`}
      className="group relative flex items-start gap-4 rounded-xl border border-border-subtle bg-card p-5 hover:border-foreground/15 hover:shadow-sm transition-all"
    >
      {/* Audio icon */}
      <div className="flex-shrink-0 mt-0.5 flex items-center justify-center w-10 h-10 rounded-lg bg-muted/60">
        <AudioLines className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="text-sm font-medium truncate group-hover:text-foreground/80 transition-colors">
            {proj.name}
          </h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}
          >
            <ModeIcon className="w-3 h-3" />
            {mode}
          </span>
          {versionCount > 1 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              v{latestAnalysis.version}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground/60">
          {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => onDelete(e, proj)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
};

/* ─── Empty state ─── */
const EmptyState = ({ icon: Icon, message }: { icon: typeof Inbox; message: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
    <Icon className="w-10 h-10 mb-3 opacity-40" />
    <p className="text-sm max-w-xs">{message}</p>
  </div>
);

/* ─── Dashboard ─── */
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

  const grouped: GroupedProject[] = projects
    .filter((p) => p.analyses.length > 0)
    .map((proj) => {
      const sorted = [...proj.analyses].sort((a, b) => b.version - a.version);
      const lastUpdated = sorted.reduce(
        (latest, a) => (a.created_at > latest ? a.created_at : latest),
        sorted[0].created_at
      );
      return { project: proj, latestAnalysis: sorted[0], versionCount: sorted.length, lastUpdated };
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
      {/* Delete confirmation */}
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
              onClick={(e) => { e.preventDefault(); void confirmDelete(); }}
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
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
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

          {/* Tabs */}
          <Tabs defaultValue="tracks" className="w-full">
            <TabsList className="bg-muted/50 mb-6">
              <TabsTrigger value="tracks" className="gap-1.5 text-xs">
                <AudioLines className="w-3.5 h-3.5" />
                My Tracks
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-1.5 text-xs">
                <Inbox className="w-3.5 h-3.5" />
                Feedback Requests
              </TabsTrigger>
              <TabsTrigger value="archive" className="gap-1.5 text-xs">
                <Archive className="w-3.5 h-3.5" />
                Archive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tracks">
              {grouped.length === 0 ? (
                <EmptyState icon={AudioLines} message="No analyses yet. Upload a track to get started." />
              ) : (
                <div className="grid gap-3">
                  {grouped.map((g) => (
                    <TrackCard key={g.project.id} grouped={g} onDelete={handleDeleteClick} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              <EmptyState
                icon={Inbox}
                message="Request feedback from another producer or share your track for review. Coming soon."
              />
            </TabsContent>

            <TabsContent value="archive">
              <EmptyState icon={Archive} message="Archived tracks will appear here." />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;

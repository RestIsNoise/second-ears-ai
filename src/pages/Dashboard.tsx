import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, Music, Eye, ArrowRight, Trash2, AudioLines, Inbox, Archive, List, LayoutGrid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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

/* ─── Track Row (list view) ─── */
const TrackRow = ({
  grouped,
  onDelete,
  onNavigate,
}: {
  grouped: GroupedProject;
  onDelete: (project: ProjectRow) => void;
  onNavigate: (path: string) => void;
}) => {
  const { project: proj, latestAnalysis, versionCount, lastUpdated } = grouped;
  const mode = latestAnalysis.mode || "technical";
  const ModeIcon = modeIcons[mode] || Activity;
  const colorClass = modeColors[mode] || modeColors.technical;

  return (
    <div
      onClick={() => onNavigate(`/project/${proj.id}`)}
      className="group relative flex items-start gap-4 rounded-xl border border-border-subtle bg-card p-5 hover:border-foreground/15 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex-shrink-0 mt-0.5 flex items-center justify-center w-10 h-10 rounded-lg bg-muted/60">
        <AudioLines className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="text-sm font-medium truncate group-hover:text-foreground/80 transition-colors">{proj.name}</h3>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}>
            <ModeIcon className="w-3 h-3" />{mode}
          </span>
          {versionCount > 1 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">v{latestAnalysis.version}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground/60">{formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}</p>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(proj); }}
        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all shrink-0 self-center"
        title="Delete project"
      >
        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
      </button>
    </div>
  );
};

/* ─── Track Grid Card ─── */
const TrackGridCard = ({
  grouped,
  onDelete,
  onNavigate,
}: {
  grouped: GroupedProject;
  onDelete: (project: ProjectRow) => void;
  onNavigate: (path: string) => void;
}) => {
  const { project: proj, latestAnalysis, versionCount, lastUpdated } = grouped;
  const mode = latestAnalysis.mode || "technical";
  const ModeIcon = modeIcons[mode] || Activity;
  const colorClass = modeColors[mode] || modeColors.technical;

  return (
    <div
      onClick={() => onNavigate(`/project/${proj.id}`)}
      className="group relative flex flex-col rounded-xl border border-border-subtle bg-card hover:border-foreground/15 hover:shadow-sm transition-all overflow-hidden cursor-pointer"
    >
      {/* Waveform placeholder */}
      <div className="h-20 bg-muted/40 flex items-center justify-center border-b border-border/40">
        <div className="flex items-end gap-[2px] h-10">
          {Array.from({ length: 32 }).map((_, i) => {
            const h = Math.sin((i / 31) * Math.PI) * 28 + 4 + Math.random() * 6;
            return (
              <div
                key={i}
                className="w-[3px] rounded-sm bg-foreground/10 group-hover:bg-foreground/15 transition-colors"
                style={{ height: h }}
              />
            );
          })}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium truncate group-hover:text-foreground/80 transition-colors">{proj.name}</h3>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(proj); }}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all shrink-0"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${colorClass}`}>
            <ModeIcon className="w-2.5 h-2.5" />{mode}
          </span>
          {versionCount > 1 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">v{latestAnalysis.version}</span>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground/50 mt-auto pt-2">{formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}</p>
      </div>
    </div>
  );
};

/* ─── Empty state ─── */
const EmptyState = ({ icon: Icon, message }: { icon: typeof Inbox; message: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
    <Icon className="w-10 h-10 mb-3 opacity-40" />
    <p className="text-sm max-w-xs">{message}</p>
  </div>
);

/* ─── Delete confirmation modal (custom, no Radix portal issues) ─── */
const DeleteConfirmModal = ({
  projectName,
  deleting,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel, deleting]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onCancel(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 animate-in fade-in-0 duration-150" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-lg border border-border bg-background p-6 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
        <h2 className="text-lg font-semibold mb-2">Delete project?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This will permanently delete <strong>{projectName}</strong> and all its analyses. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Dashboard ─── */
const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    return (localStorage.getItem("dashboard-view") as "list" | "grid") || "list";
  });

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

  const handleDeleteClick = useCallback((project: ProjectRow) => {
    setDeleteTarget(project);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    if (!deleting) {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }, [deleting]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const projectId = deleteTarget.id;
      await supabase.from("analyses").delete().eq("project_id", projectId);
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) {
        toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
        return;
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({ title: "Deleted", description: "Project removed." });
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

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
                <>
                  {/* View toggle */}
                  <div className="flex items-center justify-end gap-1 mb-4">
                    <button
                      onClick={() => { setViewMode("list"); localStorage.setItem("dashboard-view", "list"); }}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground/40 hover:text-foreground/60"}`}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setViewMode("grid"); localStorage.setItem("dashboard-view", "grid"); }}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground/40 hover:text-foreground/60"}`}
                      title="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  {viewMode === "list" ? (
                    <div className="grid gap-3">
                      {grouped.map((g) => (
                        <TrackRow key={g.project.id} grouped={g} onDelete={handleDeleteClick} onNavigate={navigate} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {grouped.map((g) => (
                        <TrackGridCard key={g.project.id} grouped={g} onDelete={handleDeleteClick} onNavigate={navigate} />
                      ))}
                    </div>
                  )}
                </>
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

      {/* Delete confirmation — rendered at root, above everything */}
      {isDeleteDialogOpen && deleteTarget && (
        <DeleteConfirmModal
          projectName={deleteTarget.name}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default Dashboard;

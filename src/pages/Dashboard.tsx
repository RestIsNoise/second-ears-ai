import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SlidersHorizontal, Music, Ear, ArrowRight, Trash2, AudioLines, Inbox, Archive, List, LayoutGrid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const modeIcons: Record<string, typeof SlidersHorizontal> = {
  technical: SlidersHorizontal,
  musical: Music,
  perception: Ear,
};

const modeColors: Record<string, { bg: string; text: string; class: string }> = {
  technical: { bg: "#f0f0f0", text: "hsl(0 0% 25%)", class: "bg-accent text-accent-foreground" },
  musical: { bg: "#f0f4ff", text: "hsl(215 60% 45%)", class: "bg-blue-500/15 text-blue-400" },
  perception: { bg: "#f5f0ff", text: "hsl(270 50% 45%)", class: "bg-purple-500/15 text-purple-400" },
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
  const ModeIcon = modeIcons[mode] || SlidersHorizontal;
  const colorClass = modeColors[mode] || modeColors.technical;

  return (
    <div
      onClick={() => onNavigate(`/project/${proj.id}`)}
      className="group relative flex items-center gap-3 cursor-pointer transition-all duration-100"
      style={{
        padding: "10px 14px",
        backgroundColor: "hsl(var(--card))",
        border: "2px solid hsl(var(--foreground) / 0.08)",
        borderRadius: 3,
        boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -1px 0 hsl(0 0% 0% / 0.04)",
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center w-8 h-8"
        style={{
          backgroundColor: "hsl(var(--panel-bg))",
          border: "1px solid hsl(var(--foreground) / 0.06)",
          borderRadius: 2,
          boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
        }}
      >
        <AudioLines className="w-4 h-4 text-foreground/50" />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <h3
          className="text-[12px] font-semibold truncate text-foreground/85 group-hover:text-foreground transition-colors"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {proj.name}
        </h3>
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-foreground/45 uppercase tracking-[0.08em] font-bold shrink-0"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            backgroundColor: "hsl(var(--foreground) / 0.04)",
            border: "1px solid hsl(var(--foreground) / 0.06)",
            borderRadius: 2,
          }}
        >
          <ModeIcon className="w-2.5 h-2.5" />{mode}
        </span>
        {versionCount > 1 && (
          <span
            className="text-foreground/30 font-bold shrink-0"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
          >
            v{latestAnalysis.version}
          </span>
        )}
      </div>
      <span
        className="text-foreground/25 shrink-0 tabular-nums"
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
      >
        {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
      </span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(proj); }}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all shrink-0"
        style={{ borderRadius: 2 }}
        title="Delete project"
      >
        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
      </button>
    </div>
  );
};

/* ─── Seeded waveform generator (deterministic per project id) ─── */
const seededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
};

const generateWaveform = (id: string, count: number) => {
  const rng = seededRandom(id);
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const envelope = Math.sin((i / (count - 1)) * Math.PI);
    const noise = 0.3 + rng() * 0.7;
    bars.push(envelope * noise);
  }
  return bars;
};

const generateMarkers = (id: string) => {
  const rng = seededRandom(id + "-markers");
  const count = 2 + Math.floor(rng() * 3);
  const markers: number[] = [];
  for (let i = 0; i < count; i++) {
    markers.push(0.08 + rng() * 0.84);
  }
  return markers.sort();
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
  const ModeIcon = modeIcons[mode] || SlidersHorizontal;
  const colorClass = modeColors[mode] || modeColors.technical;

  const bars = generateWaveform(proj.id, 56);
  const markers = generateMarkers(proj.id);
  const playheadPos = seededRandom(proj.id + "-ph")() * 0.6 + 0.15; // 15–75%
  const duration = `${Math.floor(seededRandom(proj.id + "-dur")() * 4 + 1)}:${String(Math.floor(seededRandom(proj.id + "-ds")() * 60)).padStart(2, "0")}`;

  return (
    <div
      onClick={() => onNavigate(`/project/${proj.id}`)}
      className="group relative flex flex-col overflow-hidden cursor-pointer"
      style={{
        background: "#ffffff",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        minHeight: 280,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* ══════ DARK MINI-PLAYER TOP HALF ══════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(0 0% 10%) 0%, hsl(0 0% 6%) 100%)",
          height: 160,
          borderRadius: "6px 6px 0 0",
        }}
      >
        {/* Faint grid lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, hsl(0 0% 100% / 0.03) 1px, transparent 1px), linear-gradient(hsl(0 0% 100% / 0.02) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Header bar */}
        <div
          className="relative flex items-center justify-between px-3 py-1.5"
          style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-[4px]">
              <div className="w-[5px] h-[5px] rounded-full" style={{ background: "hsl(0 0% 30%)" }} />
              <div className="w-[5px] h-[5px] rounded-full" style={{ background: "hsl(0 0% 22%)" }} />
            </div>
            <span
              className="text-[7px] text-white/15 tracking-[0.15em] uppercase font-bold"
              style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
            >
              Analysis
            </span>
          </div>
          <span
            className="text-[8px] text-white/25 tabular-nums font-medium"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            {duration}
          </span>
        </div>

        {/* Waveform lane — centered vertically in remaining space */}
        <div className="relative px-3 flex flex-col justify-center" style={{ height: "calc(100% - 28px)" }}>
          <div className="relative flex items-center justify-center h-[44px]">
            {bars.map((v, i) => {
              const halfH = Math.max(2, v * 20);
              const pos = i / bars.length;
              const played = pos < playheadPos;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center gap-[1px]"
                  style={{ width: 2.5, marginRight: 0.5 }}
                >
                  <div
                    style={{
                      width: 2,
                      height: halfH,
                      background: played ? "hsl(0 0% 65%)" : "hsl(0 0% 30%)",
                      borderRadius: 0,
                    }}
                  />
                  <div
                    style={{
                      width: 2,
                      height: halfH * 0.6,
                      background: played ? "hsl(0 0% 45%)" : "hsl(0 0% 20%)",
                      opacity: 0.7,
                      borderRadius: 0,
                    }}
                  />
                </div>
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-[1.5px]"
              style={{
                left: `${playheadPos * 100}%`,
                background: "hsl(0 0% 95%)",
                boxShadow: "0 0 6px hsl(0 0% 100% / 0.35)",
              }}
            />
          </div>

          {/* Issue markers row */}
          <div className="relative h-[12px] mt-1.5">
            <div
              className="absolute left-0 right-0 top-1/2 h-px"
              style={{ background: "hsl(0 0% 100% / 0.06)" }}
            />
            {markers.map((pos, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${pos * 100}%` }}
              >
                <div
                  className="w-px h-[8px] -translate-x-1/2"
                  style={{ background: "hsl(0 55% 52% / 0.6)" }}
                />
                <div
                  className="w-[3px] h-[3px] rounded-full -translate-x-1/2 mt-[-2px]"
                  style={{
                    background: "hsl(0 55% 52% / 0.8)",
                    boxShadow: "0 0 3px hsl(0 55% 50% / 0.5)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Bottom timestamps */}
          <div className="flex items-center justify-between mt-1">
            <span
              className="text-[7px] text-white/15"
              style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
            >
              0:00
            </span>
            <span
              className="text-[7px] text-white/15"
              style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
            >
              {duration}
            </span>
          </div>
        </div>
      </div>

      {/* ══════ INFO BOTTOM HALF ══════ */}
      <div className="px-4 py-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <h3
            className="text-[14px] font-semibold tracking-[-0.01em] truncate text-foreground/90 group-hover:text-foreground transition-colors leading-tight"
          >
            {proj.name}
          </h3>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(proj); }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all shrink-0 -mt-0.5"
            style={{ borderRadius: 3 }}
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-auto">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 uppercase tracking-[0.06em] font-semibold"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              backgroundColor: modeColor.bg,
              color: modeColor.text,
              borderRadius: 3,
            }}
          >
            <ModeIcon className="w-2.5 h-2.5" />{mode}
          </span>
          {versionCount > 1 && (
            <span
              className="text-foreground/40 font-semibold"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
            >
              v{latestAnalysis.version}
            </span>
          )}
        </div>

        <p className="mt-2 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#999" }}>
          {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

/* ─── Empty state ─── */
const EmptyState = ({ icon: Icon, message }: { icon: typeof Inbox; message: string }) => (
  <div
    className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground"
    style={{
      backgroundColor: "hsl(var(--panel-content))",
      border: "2px solid hsl(var(--foreground) / 0.06)",
      borderRadius: 3,
      boxShadow: "inset 0 2px 6px hsl(var(--panel-inset))",
    }}
  >
    <Icon className="w-8 h-8 mb-2 opacity-30" />
    <p className="text-[11px] max-w-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{message}</p>
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
      <div className="absolute inset-0 bg-black/70 animate-in fade-in-0 duration-150" />

      {/* Content */}
      <div
        className="relative z-10 w-full max-w-md mx-4 p-5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "2px solid hsl(var(--foreground) / 0.12)",
          borderRadius: 4,
          boxShadow: "0 8px 30px hsl(0 0% 0% / 0.2)",
        }}
      >
        <h2 className="text-sm font-bold mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Delete project?</h2>
        <p className="text-[12px] text-muted-foreground mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          This will permanently delete <strong>{projectName}</strong> and all its analyses.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={deleting} style={{ borderRadius: 3 }}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={deleting}
            style={{ borderRadius: 3 }}
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
  const [searchParams] = useSearchParams();
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
    if (searchParams.get("upgraded") === "true") {
      toast({
        title: "¡Bienvenido a Pro!",
        description: "Tu suscripción está activa. Ahora tenés análisis ilimitados y los 3 modos.",
        duration: 6000,
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, created_at, analyses(id, mode, feedback, created_at, version)")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[Dashboard] fetch projects error:", error.message);
        setFetching(false);
        return;
      }
      const mapped: ProjectRow[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        analyses: (p.analyses || []).map((a: any) => ({
          id: a.id,
          mode: a.mode,
          feedback: a.feedback,
          created_at: a.created_at,
          version: a.version ?? 1,
        })),
      }));
      setProjects(mapped);
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
      <main className="pt-24 pb-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header row */}
          <div
            className="flex items-center justify-between mb-4 px-4"
            style={{
              paddingTop: 12,
              paddingBottom: 12,
              backgroundColor: "hsl(var(--analysis-header))",
              border: "2px solid hsl(var(--foreground) / 0.08)",
              borderRadius: 3,
              boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -1px 0 hsl(0 0% 0% / 0.04)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{
                  background: "radial-gradient(circle at 35% 35%, hsl(var(--foreground) / 0.2), hsl(var(--foreground) / 0.06))",
                  boxShadow: "inset 0 0.5px 1px hsl(0 0% 100% / 0.15), 0 0 0 0.5px hsl(var(--foreground) / 0.06)",
                }}
              />
              <h1
                className="text-[13px] font-bold tracking-tight"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                My Projects
              </h1>
            </div>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-1.5 text-foreground/60 hover:text-foreground transition-all"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "5px 12px",
                backgroundColor: "hsl(var(--panel-bg))",
                border: "1px solid hsl(var(--foreground) / 0.1)",
                borderRadius: 2,
                boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
              }}
            >
              New analysis
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="tracks" className="w-full">
            <TabsList
              className="mb-4 h-auto p-0 gap-0 rounded-none bg-transparent"
              style={{
                borderBottom: "2px solid hsl(var(--foreground) / 0.08)",
              }}
            >
              {[
                { value: "tracks", label: "My Tracks", icon: AudioLines },
                { value: "requests", label: "Requests", icon: Inbox },
                { value: "archive", label: "Archive", icon: Archive },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="tracks">
              {grouped.length === 0 ? (
                <EmptyState icon={AudioLines} message="No analyses yet. Upload a track to get started." />
              ) : (
                <>
                  {/* View toggle */}
                  <div className="flex items-center justify-end gap-0.5 mb-3">
                    <button
                      onClick={() => { setViewMode("list"); localStorage.setItem("dashboard-view", "list"); }}
                      className="p-1.5 transition-colors"
                      style={{
                        backgroundColor: viewMode === "list" ? "hsl(var(--panel-bg))" : "transparent",
                        border: viewMode === "list" ? "1px solid hsl(var(--foreground) / 0.08)" : "1px solid transparent",
                        borderRadius: 2,
                        color: viewMode === "list" ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.3)",
                      }}
                      title="List view"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setViewMode("grid"); localStorage.setItem("dashboard-view", "grid"); }}
                      className="p-1.5 transition-colors"
                      style={{
                        backgroundColor: viewMode === "grid" ? "hsl(var(--panel-bg))" : "transparent",
                        border: viewMode === "grid" ? "1px solid hsl(var(--foreground) / 0.08)" : "1px solid transparent",
                        borderRadius: 2,
                        color: viewMode === "grid" ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.3)",
                      }}
                      title="Grid view"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {viewMode === "list" ? (
                    <div className="grid gap-1.5">
                      {grouped.map((g) => (
                        <TrackRow key={g.project.id} grouped={g} onDelete={handleDeleteClick} onNavigate={navigate} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Share2, ChevronDown, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ABCompare from "@/components/ABCompare";
import type { WaveformPlayerHandle } from "@/components/WaveformPlayer";
import FeedbackTimeline from "@/components/FeedbackTimeline";
import ShareModal from "@/components/ShareModal";
import ShareBlock from "@/components/ShareBlock";
import CollaboratorAvatars from "@/components/CollaboratorAvatars";
import TechnicalMetrics from "@/components/TechnicalMetrics";
import ToDoPanel from "@/components/ToDoPanel";
import SessionPanel from "@/components/SessionPanel";
import HumanFeedbackPanel from "@/components/HumanFeedbackPanel";
import PanelSidebar from "@/components/PanelSidebar";
import type { PanelConfig } from "@/components/PanelSidebar";
import WorkstationPanel from "@/components/WorkstationPanel";
import VersionPills from "@/components/VersionPills";
import type { VersionInfo } from "@/components/VersionPills";
import type { FeedbackResult } from "@/pages/Analyze";
import type { NormalizedFeedback, NormalizedTimelineItem } from "@/lib/normalizeFeedback";
import type { FeedbackItem, WaveformMarker, ToDoItem, MarkerType } from "@/types/feedback";
import { exportAnalysisPdf } from "@/lib/exportPdf";
import { supabase } from "@/lib/supabaseClient";

const modeLabels: Record<string, string> = {
  technical: "Technical",
  musical: "Musical",
  perception: "Perception",
};

const modeWhatWorksLabel: Record<string, string> = {
  technical: "What works",
  musical: "What lands",
  perception: "What translates",
};

const modeFixOneLabel: Record<string, string> = {
  technical: "If you fix only one thing today",
  musical: "Focus here",
  perception: "Urgent fix",
};

/** Small copy button component */
const CopyFixButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied", duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive", duration: 1500 });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-foreground/60 transition-colors"
      title="Copy fix to clipboard"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? "Copied" : "Copy fix"}</span>
    </button>
  );
};

/** Full Analysis card text — hard cut at 2 sentences */
const AnalysisCardText = ({ text }: { text: string }) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const displayText = sentences.slice(0, 2).join("").trim();

  return (
    <p className="text-[13px] text-foreground/55 max-w-[70ch]" style={{ lineHeight: 1.6 }}>
      {displayText}
    </p>
  );
};

/** Convert normalized timeline items to internal FeedbackItems */
function toFeedbackItems(items: NormalizedTimelineItem[], mode: string): FeedbackItem[] {
  return items.map((item, i) => ({
    id: `tl-${i}`,
    timestampSec: item.timestampSec >= 0 ? item.timestampSec : 0,
    title: item.title,
    observation: item.description,
    fix: item.actionText,
    severity: (i === 0 ? "high" : i < 3 ? "med" : "low") as "high" | "med" | "low",
    mode,
  }));
}

const PANELS: PanelConfig[] = [
  { id: "ai-feedback", label: "AI Feedback" },
  { id: "human-feedback", label: "Human Feedback" },
  { id: "tech-metrics", label: "Technical Metrics" },
  { id: "full-analysis", label: "Full Analysis" },
  { id: "session", label: "Session" },
  { id: "todo", label: "To-Do List" },
];

const MAX_PANELS = 3;
const DEFAULT_PANELS = new Set(["ai-feedback", "tech-metrics", "todo"]);

const FeedbackDisplay = ({
  result,
  onReset,
  audioFile,
  analysisId,
  versions,
  projectId,
}: {
  result: FeedbackResult;
  onReset: () => void;
  audioFile?: File;
  analysisId?: string | null;
  versions?: VersionInfo[];
  projectId?: string | null;
}) => {
  const { user } = useAuth();
  const n = result.normalized;
  const { mode } = n;
  const waveformRef = useRef<WaveformPlayerHandle>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [todoItems, setTodoItems] = useState<ToDoItem[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [activePanels, setActivePanels] = useState<Set<string>>(new Set(DEFAULT_PANELS));
  const [panelOrder, setPanelOrder] = useState<string[]>([...DEFAULT_PANELS]);
  const [shareOpen, setShareOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [pendingComment, setPendingComment] = useState<{ text: string; timestampSec: number } | null>(null);

  // Load todos from DB for all versions of this track
  useEffect(() => {
    if (!analysisId) { setTodosLoading(false); return; }
    const loadTodos = async () => {
      setTodosLoading(true);
      let analysisIds: string[] = [];
      if (versions && versions.length > 0) {
        analysisIds = versions.map((v) => v.analysisId);
      } else {
        analysisIds = [analysisId];
      }

      const { data, error } = await supabase
        .from("todos")
        .select("id, analysis_id, text, timestamp_in_track, is_done, source_id, created_at")
        .in("analysis_id", analysisIds)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setTodoItems(
          data.map((row: any) => ({
            id: row.id,
            text: row.text,
            timestampSec: row.timestamp_in_track,
            done: row.is_done,
            sourceId: row.source_id || undefined,
          }))
        );
      }
      setTodosLoading(false);
    };
    loadTodos();
  }, [analysisId, versions]);

  // Panel toggle
  const handleTogglePanel = useCallback((id: string) => {
    setActivePanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setPanelOrder((o) => o.filter((p) => p !== id));
      } else {
        if (next.size >= MAX_PANELS) {
          // Remove the oldest panel
          setPanelOrder((o) => {
            const oldest = o[0];
            next.delete(oldest);
            return [...o.slice(1), id];
          });
        } else {
          setPanelOrder((o) => [...o, id]);
        }
        next.add(id);
      }
      return next;
    });
  }, []);

  // Convert normalized timeline to FeedbackItems
  const rawTimelineItems = useMemo(() => toFeedbackItems(n.timelineItems, mode), [n.timelineItems, mode]);

  const timelineItems = useMemo(() => {
    const withTs = rawTimelineItems.filter((i) => i.timestampSec > 0);
    if (withTs.length > 0) return withTs;
    if (audioDuration <= 0 || rawTimelineItems.length === 0) return rawTimelineItems;
    const count = rawTimelineItems.length;
    const startPct = 0.15;
    const endPct = 0.90;
    const step = count > 1 ? (endPct - startPct) / (count - 1) : 0;
    return rawTimelineItems.map((item, i) => ({
      ...item,
      id: `auto-${i}`,
      timestampSec: audioDuration * (startPct + step * i),
    }));
  }, [rawTimelineItems, audioDuration]);

  const hasTimeline = timelineItems.length > 0;

  const modeToMarkerType: Record<string, MarkerType> = {
    technical: "technical",
    musical: "structural",
    perception: "perceptual",
  };

  const aiMarkers: WaveformMarker[] = useMemo(() => {
    return timelineItems
      .filter((i) => i.timestampSec > 0)
      .map((item) => ({
        id: item.id,
        time: item.timestampSec,
        label: item.title,
        severity: item.severity,
        type: modeToMarkerType[mode] || "technical",
      }));
  }, [timelineItems, mode]);

  const userAnnotationMarkers: WaveformMarker[] = useMemo(() => {
    return todoItems
      .filter((t) => t.timestampSec > 0 && !t.sourceId)
      .map((t) => ({
        id: t.id,
        time: t.timestampSec,
        label: t.text,
        severity: "low" as const,
        type: "user" as const,
      }));
  }, [todoItems]);

  const markers: WaveformMarker[] = useMemo(() => {
    return [...aiMarkers, ...userAnnotationMarkers];
  }, [aiMarkers, userAnnotationMarkers]);

  // To-Do management — persist to DB
  const todoSourceIds = useMemo(() => new Set(todoItems.filter(t => t.sourceId).map(t => t.sourceId!)), [todoItems]);

  const persistTodo = useCallback(async (todo: { text: string; timestampSec: number; sourceId?: string }) => {
    if (!analysisId || !user) return null;
    const { data, error } = await supabase.from("todos").insert({
      analysis_id: analysisId,
      text: todo.text,
      timestamp_in_track: todo.timestampSec,
      source_id: todo.sourceId || null,
      created_by: user.id,
    } as any).select("id").single();
    if (error) { console.error("[ToDo] persist failed:", error); return null; }
    return data?.id || null;
  }, [analysisId, user]);

  const handleAddToDoFromFeedback = useCallback(async (item: FeedbackItem) => {
    const actionText = item.fix || item.title;
    const tempId = `todo-${Date.now()}`;
    const newItem: ToDoItem = { id: tempId, text: actionText, timestampSec: item.timestampSec, done: false, sourceId: item.id };
    setTodoItems((prev) => [...prev, newItem]);
    toast({ title: "Added to To-Do", duration: 1200 });
    const dbId = await persistTodo({ text: actionText, timestampSec: item.timestampSec, sourceId: item.id });
    if (dbId) setTodoItems((prev) => prev.map((t) => t.id === tempId ? { ...t, id: dbId } : t));
  }, [persistTodo]);

  const handleAddToDoNote = useCallback(async (text: string) => {
    const tempId = `note-${Date.now()}`;
    setTodoItems((prev) => [...prev, { id: tempId, text, timestampSec: 0, done: false }]);
    const dbId = await persistTodo({ text, timestampSec: 0 });
    if (dbId) setTodoItems((prev) => prev.map((t) => t.id === tempId ? { ...t, id: dbId } : t));
  }, [persistTodo]);

  const handleAddToDoWithTimestamp = useCallback(async (text: string, timestampSec: number) => {
    const tempId = `ht-${Date.now()}`;
    setTodoItems((prev) => [...prev, { id: tempId, text, timestampSec, done: false }]);
    toast({ title: "Added to To-Do", duration: 1200 });
    const dbId = await persistTodo({ text, timestampSec });
    if (dbId) setTodoItems((prev) => prev.map((t) => t.id === tempId ? { ...t, id: dbId } : t));
  }, [persistTodo]);

  const handleAddNoteFromWaveform = useCallback((text: string, timestampSec: number) => {
    // Route to Human Feedback panel and ensure it's visible
    setPendingComment({ text, timestampSec });
    setActivePanels((prev) => {
      if (prev.has("human-feedback")) return prev;
      const next = new Set(prev);
      if (next.size >= MAX_PANELS) {
        // Make room by removing the last non-essential panel
        const removable = ["full-analysis", "tech-metrics", "todo"];
        for (const r of removable) {
          if (next.has(r)) { next.delete(r); break; }
        }
      }
      next.add("human-feedback");
      return next;
    });
  }, []);

  const handleToggleToDo = useCallback(async (id: string) => {
    const item = todoItems.find((t) => t.id === id);
    if (!item) return;
    const newDone = !item.done;
    setTodoItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: newDone } : t))
    );
    await supabase.from("todos").update({ is_done: newDone } as any).eq("id", id);
  }, [todoItems]);

  const handleToDoItemClick = useCallback((item: ToDoItem) => {
    if (item.timestampSec > 0) {
      waveformRef.current?.seekTo(item.timestampSec);
      const feedbackItem = timelineItems.find((fi) => fi.id === item.sourceId);
      if (feedbackItem) setActiveItemId(feedbackItem.id);
    }
  }, [timelineItems]);

  const handleEditAnnotation = useCallback((markerId: string) => {
    const todo = todoItems.find((t) => t.id === markerId);
    if (todo) {
      waveformRef.current?.seekTo(todo.timestampSec);
      setActiveItemId(markerId);
    }
  }, [todoItems]);

  const handleMarkerClick = useCallback(
    (marker: WaveformMarker) => {
      setActiveItemId(marker.id);
      waveformRef.current?.seekTo(marker.time);
    },
    []
  );

  const handleItemClick = useCallback(
    (item: FeedbackItem) => {
      setActiveItemId(item.id);
      waveformRef.current?.seekTo(item.timestampSec);
    },
    []
  );

  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (timelineItems.length === 0) return;
      let nearest: FeedbackItem | null = null;
      for (const item of timelineItems) {
        if (item.timestampSec <= time + 0.5) {
          nearest = item;
        }
      }
      if (nearest && nearest.id !== activeItemId) {
        setActiveItemId(nearest.id);
      }
    },
    [timelineItems, activeItemId]
  );

  // Release readiness from metrics
  const releaseReadiness = useMemo(() => {
    if (n.releaseStatus) return n.releaseStatus;
    const lufs = n.metrics.integratedLufs;
    const peak = n.metrics.peakDbtp;
    if (lufs !== null && peak !== null) {
      if (lufs >= -14 && lufs <= -9 && peak < -1) return "Ready";
      if ((lufs >= -16 && lufs <= -7) && peak < 0) return "Almost there";
      return "Needs work";
    }
    return null;
  }, [n.releaseStatus, n.metrics]);

  // Convert normalized metrics to TechnicalMetrics component shape
  const technicalMetrics = useMemo(() => {
    const m = n.metrics;
    const hasAny = Object.values(m).some((v) => v !== null);
    if (!hasAny) return undefined;
    return {
      integrated_lufs: m.integratedLufs ?? undefined,
      short_term_lufs: m.shortTermLufs ?? undefined,
      dynamic_range: m.dynamicRange ?? undefined,
      peak_dbtp: m.peakDbtp ?? undefined,
      stereo_correlation: m.stereoCorrelation ?? undefined,
      crest_factor: m.crestFactor ?? undefined,
      sub_kick_ratio: m.subKickRatio ?? undefined,
      lra: m.lra ?? undefined,
    };
  }, [n.metrics]);

  // Full analysis cards by mode
  const fullAnalysisCards = useMemo(() => {
    const fa = n.fullAnalysis;
    if (mode === "musical") {
      return [
        { key: "energyArc", label: "Energy Arc", text: fa.energyArc },
        { key: "sectionContrast", label: "Section Contrast", text: fa.sectionContrast },
        { key: "grooveContinuity", label: "Groove Continuity", text: fa.grooveContinuity },
        { key: "hookClarity", label: "Hook Clarity", text: fa.hookClarity },
      ];
    }
    if (mode === "perception") {
      return [
        { key: "subLowTranslation", label: "Sub & Low Translation", text: fa.subLowTranslation },
        { key: "headroomTransients", label: "Headroom & Transients", text: fa.headroomTransients },
        { key: "stereoFoldDown", label: "Stereo Fold-Down", text: fa.stereoFoldDown },
        { key: "listenerFatigue", label: "Listener Fatigue", text: fa.listenerFatigue },
      ];
    }
    return [
      { key: "mixBalance", label: "Mix Balance", text: fa.mixBalance },
      { key: "dynamics", label: "Dynamics & Loudness", text: fa.dynamics },
      { key: "stereoSpace", label: "Stereo & Space", text: fa.stereoSpace },
      { key: "frequencyBalance", label: "Frequency Balance", text: fa.frequencyBalance },
    ];
  }, [n.fullAnalysis, mode]);

  const hasFullAnalysis = fullAnalysisCards.some((c) => c.text);

  // Render individual panel content
  const renderPanelContent = (panelId: string) => {
    switch (panelId) {
      case "ai-feedback":
        return (
          <div className="relative h-full" style={{ overflowY: "scroll" }} ref={timelineScrollRef}>
            {/* Cards area */}
            <div className="p-4">
              {hasTimeline && (
                <FeedbackTimeline
                  items={timelineItems}
                  activeItemId={activeItemId}
                  onItemClick={handleItemClick}
                  onAddToDo={handleAddToDoFromFeedback}
                  todoItemIds={todoSourceIds}
                  scrollContainerRef={timelineScrollRef}
                />
              )}
              {!hasTimeline && n.timelineItems.length > 0 && (
                <div className="space-y-3">
                  {n.timelineItems.map((item, i) => {
                    const copyText = `${item.title}\nWhy: ${item.description}\n${item.actionLabel}: ${item.actionText}`;
                    return (
                      <div key={i} className="group relative rounded-lg border-l-2 border-l-amber-400 border border-border-subtle p-4 bg-background">
                        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CopyFixButton text={copyText} />
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-mono-brand text-lg text-muted-foreground/30 font-medium leading-none pt-0.5">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="flex-1 min-w-0 pr-12">
                            <h3 className="text-[15px] font-semibold tracking-tight">{item.title}</h3>
                            {item.description && (
                              <p className="text-[13px] text-foreground/55 mt-1.5" style={{ lineHeight: 1.6 }}>{item.description}</p>
                            )}
                            {item.actionText && (
                              <div className="mt-2.5 flex items-start gap-2">
                                <span
                                  className="shrink-0 mt-0.5 inline-flex items-center rounded-full bg-foreground text-background px-2 py-0.5"
                                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.06em", lineHeight: 1 }}
                                >
                                  {item.actionLabel.toUpperCase()}
                                </span>
                                <p className="text-[13px] text-foreground/70" style={{ lineHeight: 1.6 }}>{item.actionText}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!hasTimeline && n.timelineItems.length === 0 && (
                <FeedbackTimeline
                  items={[]}
                  activeItemId={null}
                  onItemClick={() => {}}
                />
              )}
              <div className="h-40" />
            </div>
          </div>
        );

      case "human-feedback":
        return (
          <HumanFeedbackPanel
            analysisId={analysisId ?? null}
            currentTime={currentTime}
            onAddToDo={handleAddToDoWithTimestamp}
            pendingComment={pendingComment}
            onPendingCommentHandled={() => setPendingComment(null)}
          />
        );

      case "tech-metrics":
        return (
          <div className="p-3">
            {technicalMetrics ? (
              <TechnicalMetrics metrics={technicalMetrics} compact />
            ) : (
              <p className="text-xs text-muted-foreground/50 text-center py-8">No metrics available</p>
            )}
          </div>
        );

      case "full-analysis":
        return (
          <div className="p-4 space-y-3">
            {hasFullAnalysis ? (
              fullAnalysisCards.map(({ key, label, text }) =>
                text ? (
                  <div key={key} className="rounded-xl border border-border-subtle p-3 bg-background">
                    <h3 className="text-[13px] font-semibold tracking-tight mb-1.5">{label}</h3>
                    <AnalysisCardText text={text} />
                  </div>
                ) : null
              )
            ) : (
              <p className="text-xs text-muted-foreground/50 text-center py-8">No analysis data</p>
            )}

            {/* Fix One Thing */}
            {n.ifFixOneThing && (n.ifFixOneThing.title || n.ifFixOneThing.how || n.ifFixOneThing.why) && (
              <div className="mt-4">
                <p className="font-mono-brand text-[10px] text-muted-foreground tracking-widest uppercase mb-2">
                  {modeFixOneLabel[mode] || "If you fix only one thing today"}
                </p>
                <div className="rounded-xl border-2 border-foreground/10 p-4 bg-secondary/20">
                  {n.ifFixOneThing.how && !n.ifFixOneThing.why && !n.ifFixOneThing.title ? (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground leading-relaxed">{n.ifFixOneThing.how}</p>
                      <CopyFixButton text={n.ifFixOneThing.how} />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold tracking-tight mb-1">{n.ifFixOneThing.title}</h3>
                        <CopyFixButton text={`${n.ifFixOneThing.title}\nWhy: ${n.ifFixOneThing.why || ""}\nHow: ${n.ifFixOneThing.how || ""}`} />
                      </div>
                      {n.ifFixOneThing.why && (
                        <p className="text-[12px] text-foreground/55 leading-relaxed mb-2" style={{ lineHeight: 1.55 }}>
                          {n.ifFixOneThing.why}
                        </p>
                      )}
                      {n.ifFixOneThing.how && (
                        <p className="text-[12px] text-foreground/70 leading-relaxed" style={{ lineHeight: 1.55 }}>
                          <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">How</span>
                          {n.ifFixOneThing.how}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "session":
        return <SessionPanel />;

      case "todo":
        return (
          <ToDoPanel
            items={todoItems}
            onToggle={handleToggleToDo}
            onAdd={handleAddToDoNote}
            onItemClick={handleToDoItemClick}
            loading={todosLoading}
          />
        );

      default:
        return null;
    }
  };

  const panelTitles: Record<string, string> = {
    "ai-feedback": "AI Feedback",
    "human-feedback": "Human Feedback",
    "tech-metrics": "Technical Metrics",
    "full-analysis": "Full Analysis",
    "session": "Session",
    "todo": "To-Do List",
  };

  // Ordered active panels (preserve sidebar order)
  const orderedActivePanels = PANELS.filter((p) => activePanels.has(p.id));

  return (
    <div className="animate-fade-up">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-2 text-muted-foreground mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> New analysis
          </Button>

          <div className="space-y-1.5">
            {n.trackName && (
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                {n.trackName}
              </h1>
            )}
            <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
              {modeLabels[mode]} analysis
            </p>
            {versions && versions.length > 0 && projectId && analysisId && (
              <VersionPills
                versions={versions}
                currentAnalysisId={analysisId}
                projectId={projectId}
                trackName={n.trackName}
                mode={mode}
              />
            )}
          </div>
        </div>

        {/* Collaborator avatars */}
        <div className="flex items-center gap-3 pt-2">
          <CollaboratorAvatars analysisId={analysisId ?? null} />
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        analysisId={analysisId ?? null}
        isPublic={isPublic}
        onTogglePublic={async (val) => {
          setIsPublic(val);
          if (analysisId) {
            await supabase.from("analyses").update({ is_public: val } as any).eq("id", analysisId);
          }
        }}
        onExportPdf={() => exportAnalysisPdf(n, releaseReadiness)}
      />

      {/* ═══ WAVEFORM ═══ */}
      {audioFile && (
        <div className="mt-7 md:mt-8 w-full overflow-hidden">
          <ABCompare
            ref={waveformRef}
            audioFileA={audioFile}
            markersA={markers}
            activeMarkerId={activeItemId}
            onMarkerClick={handleMarkerClick}
            onTimeUpdate={handleTimeUpdate}
            onDurationReady={setAudioDuration}
            onAddNote={handleAddNoteFromWaveform}
            onAddToDo={handleAddToDoWithTimestamp}
            onEditNote={handleEditAnnotation}
          />
        </div>
      )}

      {/* ═══ OVERALL IMPRESSION ═══ */}
      {n.overallImpression && (
        <div className="mt-5">
          <p className="text-[13px] text-foreground/60 leading-relaxed max-w-[85ch]" style={{ lineHeight: 1.6 }}>
            {n.overallImpression}
          </p>
        </div>
      )}

      {/* ═══ COMPACT SUMMARY BADGES ═══ */}
      {(n.topIssue || n.biggestWin || releaseReadiness) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {n.topIssue && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-background px-3 py-1">
              <span className="font-mono-brand text-[9px] text-muted-foreground/50 uppercase tracking-wider">Issue</span>
              <span className="text-[11px] font-medium text-foreground">{n.topIssue}</span>
            </span>
          )}
          {n.biggestWin && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-background px-3 py-1">
              <span className="font-mono-brand text-[9px] text-muted-foreground/50 uppercase tracking-wider">Win</span>
              <span className="text-[11px] font-medium text-foreground">{n.biggestWin}</span>
            </span>
          )}
          {releaseReadiness && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-background px-3 py-1">
              <span className="font-mono-brand text-[9px] text-muted-foreground/50 uppercase tracking-wider">Release</span>
              <span className="text-[11px] font-medium text-foreground">{releaseReadiness}</span>
            </span>
          )}
        </div>
      )}

      {/* ═══ SIDEBAR + PANELS WORKSTATION ═══ */}
      <div className="mt-6 flex border border-border-subtle rounded-xl overflow-hidden" style={{ height: "calc(100vh - 350px)", minHeight: 420 }}>
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <PanelSidebar
            panels={PANELS}
            activePanels={activePanels}
            onToggle={handleTogglePanel}
            maxPanels={MAX_PANELS}
            footer={
              <ShareBlock onExportPdf={() => exportAnalysisPdf(n, releaseReadiness)} analysisId={analysisId} />
            }
          />
        </div>

        {/* Mobile panel selector */}
        <div className="md:hidden w-full flex flex-col">
          <div className="flex overflow-x-auto border-b border-border-subtle p-1.5 gap-1 scrollbar-thin">
            {PANELS.map((panel) => {
              const isActive = activePanels.has(panel.id);
              return (
                <button
                  key={panel.id}
                  onClick={() => handleTogglePanel(panel.id)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground/50 hover:text-foreground"
                  }`}
                >
                  {panel.label}
                </button>
              );
            })}
          </div>
          {/* Mobile: stack panels vertically */}
          <div className="flex flex-col">
            {orderedActivePanels.map((panel) => (
              <div key={panel.id} className="border-b border-border-subtle last:border-b-0">
                <WorkstationPanel
                  id={panel.id}
                  title={panelTitles[panel.id] || panel.label}
                  onClose={() => handleTogglePanel(panel.id)}
                >
                  {renderPanelContent(panel.id)}
                </WorkstationPanel>
              </div>
            ))}
          </div>
          {/* Mobile share button */}
          <div className="p-3 border-t border-border-subtle">
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="w-full h-8 gap-1.5 text-xs">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
          </div>
        </div>

        {/* Desktop panels area */}
        <div className="hidden md:flex flex-1 min-w-0">
          {orderedActivePanels.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/40">
              Select a panel from the sidebar
            </div>
          )}
          {orderedActivePanels.map((panel) => (
            <WorkstationPanel
              key={panel.id}
              id={panel.id}
              title={panelTitles[panel.id] || panel.label}
              onClose={() => handleTogglePanel(panel.id)}
            >
              {renderPanelContent(panel.id)}
            </WorkstationPanel>
          ))}
        </div>
      </div>

      {/* ═══ WHAT WORKS & YOUR FOCUS — fixed below panels ═══ */}
      {(n.whatWorks.length > 0 || n.yourFocus.question) && (
        <div
          className="mt-6 grid gap-6 border-t border-border-subtle pt-6"
          style={{ gridTemplateColumns: n.whatWorks.length > 0 && n.yourFocus.question ? "1fr 1fr" : "1fr" }}
        >
          {/* What Works */}
          {n.whatWorks.length > 0 && (
            <div>
              <h3 className="font-mono-brand text-[11px] text-muted-foreground tracking-widest uppercase mb-3">
                {modeWhatWorksLabel[mode] || "What Works"}
              </h3>
              <div className="space-y-2">
                {n.whatWorks.map((item, i) => (
                  <div key={i} className={`rounded-xl border border-border-subtle bg-card ${item.description ? "p-3.5" : "p-3"}`}>
                    <h4 className="text-sm font-semibold tracking-tight">{item.title}</h4>
                    {item.description && (
                      <p className="text-[12px] text-foreground/55 mt-1" style={{ lineHeight: 1.575 }}>{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your Focus */}
          {n.yourFocus.question && (
            <div>
              <h3 className="font-mono-brand text-[11px] text-muted-foreground tracking-widest uppercase mb-3">
                Your Focus
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">You asked</p>
                  <p className="text-[13px] text-foreground/70 leading-relaxed italic" style={{ lineHeight: 1.575 }}>
                    &ldquo;{n.yourFocus.question}&rdquo;
                  </p>
                </div>
                <div>
                  <p className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">Response</p>
                  <p className="text-[13px] text-foreground/60 leading-relaxed" style={{ lineHeight: 1.575 }}>
                    {n.yourFocus.response || "No direct focus response available for this run."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;

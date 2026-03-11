import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Share2, Layers, Music, Link2 } from "lucide-react";
import CompactFooter from "@/components/CompactFooter";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ABCompare from "@/components/ABCompare";
import type { WaveformPlayerHandle } from "@/components/WaveformPlayer";
import FeedbackTimeline from "@/components/FeedbackTimeline";
import ShareModal from "@/components/ShareModal";
import ShareBlock from "@/components/ShareBlock";
import CollaboratorAvatars from "@/components/CollaboratorAvatars";
import TechnicalMetrics from "@/components/TechnicalMetrics";
import ToDoPanel from "@/components/ToDoPanel";
import SessionPanel from "@/components/SessionPanel";
import AlsAnalyzer from "@/components/AlsAnalyzer";
import HumanFeedbackPanel from "@/components/HumanFeedbackPanel";
import PanelSidebar from "@/components/PanelSidebar";
import type { PanelConfig } from "@/components/PanelSidebar";
import WorkstationPanel from "@/components/WorkstationPanel";
import VersionPills from "@/components/VersionPills";
import type { VersionInfo } from "@/components/VersionPills";
import ReferenceUploadModal from "@/components/ReferenceUploadModal";
import AIReferencePanel from "@/components/AIReferencePanel";
import type { ReferenceResult } from "@/components/AIReferencePanel";
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

/* Tag detection for What Works items */
const TAG_KEYWORDS: Record<string, string[]> = {
  Dynamics: ["dynamic", "loudness", "compressor", "limiter", "punch"],
  "Low End": ["bass", "sub", "low end", "kick", "low frequency"],
  Stereo: ["stereo", "width", "panning", "spatial", "imaging"],
  Clarity: ["clarity", "clean", "transparent", "clear", "definition"],
  Energy: ["energy", "drive", "momentum", "intensity"],
  Translation: ["translation", "translate", "mono", "fold-down", "device"],
  Midrange: ["mid", "midrange", "vocal", "presence"],
  Highs: ["treble", "high", "brightness", "air", "shimmer"],
  Groove: ["groove", "rhythm", "timing", "feel", "swing"],
  Balance: ["balance", "mix balance", "level", "proportion"],
};

function detectTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) tags.push(tag);
    if (tags.length >= 2) break;
  }
  return tags;
}

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
  { id: "ai-reference", label: "AI Reference" },
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
  const navigate = useNavigate();
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
  const [showArrangement, setShowArrangement] = useState(false);
  const arrangementRef = useRef<HTMLDivElement>(null);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refLoading, setRefLoading] = useState(false);
  const [refResult, setRefResult] = useState<ReferenceResult | null>(null);
  const [refTrackName, setRefTrackName] = useState("");
  const [refAudioFile, setRefAudioFile] = useState<File | null>(null);

  // Reference comparison polling
  const handleRefComparisonStart = useCallback((jobId: string, refName: string, refFile: File) => {
    setRefTrackName(refName);
    setRefAudioFile(refFile);
    setRefLoading(true);
    setRefResult(null);

    // Auto-open the AI Reference panel
    setActivePanels((prev) => {
      const next = new Set(prev);
      if (!next.has("ai-reference")) {
        if (next.size >= MAX_PANELS) {
          // Remove oldest non-essential panel
          const removable = ["full-analysis", "session", "tech-metrics"];
          for (const r of removable) {
            if (next.has(r)) { next.delete(r); break; }
          }
        }
        next.add("ai-reference");
      }
      return next;
    });
    setPanelOrder((o) => o.includes("ai-reference") ? o : ["ai-reference", ...o]);

    let attempts = 0;
    const maxAttempts = 90; // 6 minutes
    const poll = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(poll);
        setRefLoading(false);
        toast({ title: "Reference comparison timed out", variant: "destructive" });
        return;
      }
      try {
        const res = await fetch(
          `https://secondears-backend-production.up.railway.app/api/reference-comparison/status/${jobId}`,
          { headers: { "x-api-key": "secondears-secret-2024" } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "done" && data.result) {
          clearInterval(poll);
          setRefResult(data.result);
          setRefLoading(false);
          toast({ title: "Reference comparison complete", duration: 2000 });
        } else if (data.status === "error") {
          clearInterval(poll);
          setRefLoading(false);
          toast({ title: "Comparison failed", description: data.error, variant: "destructive" });
        }
      } catch {
        // silently retry
      }
    }, 4000);
  }, []);

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
                  analysisId={analysisId}
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
              <div className="flex flex-col items-center justify-center py-14 gap-1.5">
                <span className="text-[10px] text-muted-foreground/30">No metrics available</span>
                <span className="text-[8px] text-muted-foreground/20">Metrics appear after analysis</span>
              </div>
            )}
          </div>
        );

      case "full-analysis":
        return (
          <div className="space-y-0">
            {hasFullAnalysis ? (
              fullAnalysisCards.map(({ key, label, text }) =>
                text ? (
                  <div
                    key={key}
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid hsl(var(--foreground) / 0.05)",
                    }}
                  >
                    <h3
                      className="text-foreground/50 uppercase tracking-[0.1em] font-extrabold mb-1"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8 }}
                    >
                      {label}
                    </h3>
                    <AnalysisCardText text={text} />
                  </div>
                ) : null
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-14 gap-1.5">
                <span className="text-[9px] text-foreground/20 uppercase tracking-wider font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>No data</span>
              </div>
            )}

            {/* Fix One Thing */}
            {n.ifFixOneThing && (n.ifFixOneThing.title || n.ifFixOneThing.how || n.ifFixOneThing.why) && (
              <div
                style={{
                  padding: "10px",
                  borderTop: "2px solid hsl(var(--foreground) / 0.08)",
                  backgroundColor: "hsl(var(--panel-bg))",
                  boxShadow: "inset 0 2px 4px hsl(var(--panel-inset))",
                }}
              >
                <p
                  className="text-foreground/35 uppercase tracking-[0.12em] font-extrabold mb-2"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7 }}
                >
                  {modeFixOneLabel[mode] || "Priority fix"}
                </p>
                <div
                  style={{
                    borderLeft: "3px solid hsl(var(--foreground) / 0.2)",
                    padding: "6px 8px",
                  }}
                >
                  {n.ifFixOneThing.how && !n.ifFixOneThing.why && !n.ifFixOneThing.title ? (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] text-foreground/65" style={{ lineHeight: 1.5, fontFamily: "'IBM Plex Mono', monospace" }}>{n.ifFixOneThing.how}</p>
                      <CopyFixButton text={n.ifFixOneThing.how} />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[12px] font-bold tracking-tight text-foreground/80" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{n.ifFixOneThing.title}</h3>
                        <CopyFixButton text={`${n.ifFixOneThing.title}\n${n.ifFixOneThing.why || ""}\n${n.ifFixOneThing.how || ""}`} />
                      </div>
                      {n.ifFixOneThing.why && (
                        <p className="text-[10px] text-foreground/45 mt-1" style={{ lineHeight: 1.5, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {n.ifFixOneThing.why}
                        </p>
                      )}
                      {n.ifFixOneThing.how && (
                        <p className="text-[10px] text-foreground/60 mt-1.5" style={{ lineHeight: 1.5, fontFamily: "'IBM Plex Mono', monospace" }}>
                          <span className="text-foreground/30 uppercase tracking-wider font-extrabold mr-1.5" style={{ fontSize: 7 }}>How</span>
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

      case "ai-reference":
        return (
          <AIReferencePanel
            loading={refLoading}
            result={refResult}
            refTrackName={refTrackName}
            onUploadClick={() => setRefModalOpen(true)}
          />
        );

      default:
        return null;
    }
  };

  const panelTitles: Record<string, string> = {
    "ai-reference": "AI Reference",
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
    <div className="animate-fade-up space-y-0" style={{ position: "relative" }}>
      {/* Micro-texture background for the entire workspace area */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025] z-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px 256px",
        }}
      />
      {/* ═══ HEADER — industrial track strip ═══ */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6 px-3 sm:px-5"
        style={{
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: "hsl(var(--analysis-header))",
          border: "2px solid hsl(var(--foreground) / 0.08)",
          borderRadius: 3,
          boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -1px 0 hsl(0 0% 0% / 0.06), 0 2px 8px hsl(0 0% 0% / 0.06)",
        }}
      >
        {/* Left: back + title */}
        <div className="min-w-0 flex-1 flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="shrink-0 text-foreground/40 hover:text-foreground/70 w-7 h-7 sm:w-8 sm:h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3">
              {n.trackName && (
                projectId ? (
                  <h1
                    className="text-[14px] sm:text-xl md:text-2xl font-bold tracking-tight truncate text-foreground hover:text-primary/80 cursor-pointer transition-colors"
                    onClick={() => navigate(`/project/${projectId}`)}
                    title="View all versions"
                  >
                    {n.trackName}
                  </h1>
                ) : (
                  <h1 className="text-[14px] sm:text-xl md:text-2xl font-bold tracking-tight truncate text-foreground">
                    {n.trackName}
                  </h1>
                )
              )}
              <span
                className="shrink-0 text-foreground/35 uppercase tracking-[0.1em] font-extrabold hidden sm:inline-block"
                style={{
                  fontFamily: "'IBM Plex Mono', 'DM Mono', monospace",
                  fontSize: 8,
                  padding: "2px 6px",
                  backgroundColor: "hsl(var(--foreground) / 0.04)",
                  border: "1px solid hsl(var(--foreground) / 0.06)",
                  borderRadius: 2,
                }}
              >
                {modeLabels[mode]}
              </span>
            </div>
            {versions && versions.length > 0 && projectId && analysisId && (
              <div className="mt-0.5 sm:mt-1">
                <VersionPills
                  versions={versions}
                  currentAnalysisId={analysisId}
                  projectId={projectId}
                  trackName={n.trackName}
                  mode={mode}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: mode badge (mobile) + collaborators */}
        <div className="flex items-center gap-2 shrink-0 sm:justify-end">
          <span
            className="sm:hidden text-foreground/35 uppercase tracking-[0.1em] font-extrabold"
            style={{
              fontFamily: "'IBM Plex Mono', 'DM Mono', monospace",
              fontSize: 7.5,
              padding: "2px 5px",
              backgroundColor: "hsl(var(--foreground) / 0.04)",
              border: "1px solid hsl(var(--foreground) / 0.06)",
              borderRadius: 2,
            }}
          >
            {modeLabels[mode]}
          </span>
          <CollaboratorAvatars analysisId={analysisId ?? null} />
        </div>
      </div>

      {/* Reference Upload Modal */}
      <ReferenceUploadModal
        open={refModalOpen}
        onClose={() => setRefModalOpen(false)}
        onComparisonStart={handleRefComparisonStart}
        userMetrics={n.rawTechnicalMetrics || {
          integratedLoudness: n.metrics.integratedLufs != null ? String(n.metrics.integratedLufs) : undefined,
          lra: n.metrics.lra != null ? String(n.metrics.lra) : undefined,
          rms: n.metrics.shortTermLufs != null ? String(n.metrics.shortTermLufs) : undefined,
          peakDbTP: n.metrics.peakDbtp != null ? String(n.metrics.peakDbtp) : undefined,
          dynamicRange: n.metrics.dynamicRange != null ? String(n.metrics.dynamicRange) : undefined,
          stereoWidth: n.metrics.stereoCorrelation ?? undefined,
          transientDensity: n.metrics.crestFactor != null ? String(n.metrics.crestFactor) : undefined,
          subKickRatio: n.metrics.subKickRatio ?? undefined,
        }}
        userTrackName={n.trackName || audioFile?.name || ""}
        mode={mode}
      />

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

      {/* ═══ UNIFIED WORKSPACE MODULE ═══ */}
      <div
        className="mt-3 sm:mt-5 overflow-hidden"
        style={{
          backgroundColor: "hsl(var(--workspace-bg))",
          border: "2px solid hsl(var(--foreground) / 0.14)",
          borderRadius: 3,
          boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12), 0 0 0 1px hsl(var(--foreground) / 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.05)",
        }}
      >
        {/* ── WAVEFORM PLAYER ── */}
        {audioFile && (
          <div className="w-full overflow-hidden" style={{ borderRadius: "4px 4px 0 0" }}>
            <ABCompare
              ref={waveformRef}
              audioFileA={audioFile}
              audioFileB={refAudioFile || null}
              refTrackName={refTrackName}
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

        {/* ── SUMMARY SECTION ── */}
        {(n.overallImpression || n.topIssue || n.biggestWin || releaseReadiness) && (
          <>
            {/* Machined transition — player to summary */}
            <div style={{ height: 1, background: "rgba(0,0,0,0.15)" }} />
            <div style={{ height: 2, background: "hsl(var(--foreground) / 0.1)" }} />
            <div style={{ height: 1, background: "hsl(0 0% 100% / 0.02)" }} />

            <div
              className="px-5 py-6 md:px-8 md:py-7"
              style={{
                backgroundColor: "hsl(var(--panel-content))",
                boxShadow: "inset 0 2px 6px hsl(var(--panel-inset))",
              }}
            >
              {/* Top row: paragraph + action buttons */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {n.overallImpression && (
                  <p className="text-[12px] sm:text-[13px] text-foreground/65 max-w-[72ch] flex-1 min-w-0" style={{ lineHeight: 1.75, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {n.overallImpression}
                  </p>
                )}

                {/* Action controls — industrial buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setShowArrangement((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-foreground/50 hover:text-foreground/80 transition-all duration-150"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "5px 10px",
                      backgroundColor: "hsl(var(--panel-bg))",
                      border: "1px solid hsl(var(--foreground) / 0.08)",
                      borderRadius: 2,
                      boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
                    }}
                  >
                    <Layers className="w-3 h-3" />
                    <span className="hidden sm:inline">{showArrangement ? "Hide Arr." : "Arrangement"}</span>
                    <span className="sm:hidden">{showArrangement ? "Hide" : "Arr."}</span>
                  </button>
                  <button
                    onClick={() => setRefModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-foreground/50 hover:text-foreground/80 transition-all duration-150"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "5px 10px",
                      backgroundColor: "hsl(var(--panel-bg))",
                      border: "1px solid hsl(var(--foreground) / 0.08)",
                      borderRadius: 2,
                      boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
                    }}
                  >
                    <Music className="w-3 h-3" />
                    <span className="hidden sm:inline">Reference</span>
                    <span className="sm:hidden">Ref</span>
                  </button>
                </div>
              </div>

              {(n.topIssue || n.biggestWin || releaseReadiness) && (
                <div className={cn("flex flex-wrap items-center gap-2", n.overallImpression && "mt-4")}>
                  {n.topIssue && (
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "hsl(var(--panel-bg))",
                        border: "1px solid hsl(var(--foreground) / 0.06)",
                        borderRadius: 2,
                      }}
                    >
                      <span
                        className="text-foreground/40 uppercase tracking-[0.08em] font-extrabold"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7.5 }}
                      >Issue</span>
                      <span className="text-[11px] font-medium text-foreground/70" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{n.topIssue}</span>
                    </span>
                  )}
                  {n.biggestWin && (
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "hsl(var(--panel-bg))",
                        border: "1px solid hsl(var(--foreground) / 0.06)",
                        borderRadius: 2,
                      }}
                    >
                      <span
                        className="text-foreground/40 uppercase tracking-[0.08em] font-extrabold"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7.5 }}
                      >Win</span>
                      <span className="text-[11px] font-medium text-foreground/70" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{n.biggestWin}</span>
                    </span>
                  )}
                  {releaseReadiness && (
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "hsl(var(--panel-bg))",
                        border: "1px solid hsl(var(--foreground) / 0.06)",
                        borderRadius: 2,
                      }}
                    >
                      <span
                        className="text-foreground/40 uppercase tracking-[0.08em] font-extrabold"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7.5 }}
                      >Release</span>
                      <span className="text-[11px] font-medium text-foreground/70" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{releaseReadiness}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── PANELS WORKSTATION — machined transition ── */}
        <div className="hidden sm:block" style={{ height: 1, background: "hsl(0 0% 0% / 0.2)" }} />
        <div style={{ height: 2, background: "hsl(var(--foreground) / 0.12)" }} />
        <div className="hidden sm:block" style={{ height: 1, background: "hsl(0 0% 100% / 0.03)" }} />
        <div
          className="flex flex-col md:flex-row overflow-hidden"
          style={{
            minHeight: 340,
            backgroundColor: "hsl(var(--panel-bg))",
            boxShadow: "inset 0 4px 12px hsl(var(--panel-inset))",
          }}
        >
          {/* On md+ use fixed height for horizontal layout */}
          <style>{`@media (min-width: 768px) { .workspace-panels-container { height: calc(100vh - 300px) !important; min-height: 420px !important; } }`}</style>
          <div className="hidden md:flex md:flex-row flex-1 min-w-0 workspace-panels-container" style={{ height: "calc(100vh - 300px)", minHeight: 420 }}>
        {/* Desktop sidebar */}
          <PanelSidebar
            panels={PANELS}
            activePanels={activePanels}
            onToggle={handleTogglePanel}
            maxPanels={MAX_PANELS}
            footer={
              <ShareBlock onExportPdf={() => exportAnalysisPdf(n, releaseReadiness)} analysisId={analysisId} />
            }
          />

          {/* Desktop panels area */}
          <div className="flex flex-1 min-w-0">
            {orderedActivePanels.length === 0 && (
              <div
                className="flex-1 flex flex-col items-center justify-center gap-1"
                style={{ backgroundColor: "hsl(var(--panel-content))" }}
              >
                <span className="text-[10px] text-foreground/25" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>No panels open</span>
                <span className="text-[8px] text-foreground/15" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Select from the sidebar</span>
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

        {/* ═══ MOBILE PANELS — full-width stacked modules ═══ */}
        <div className="md:hidden flex flex-col">
          {/* Module selector — horizontal strip */}
          <div
            className="flex overflow-x-auto scrollbar-thin"
            style={{
              backgroundColor: "hsl(var(--panel-header))",
              borderBottom: "2px solid hsl(var(--foreground) / 0.1)",
              padding: "0 2px",
            }}
          >
            {PANELS.map((panel) => {
              const isActive = activePanels.has(panel.id);
              return (
                <button
                  key={panel.id}
                  onClick={() => handleTogglePanel(panel.id)}
                  className="shrink-0 transition-all duration-100"
                  style={{
                    padding: "7px 10px",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8,
                    fontWeight: isActive ? 800 : 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isActive ? "hsl(var(--foreground) / 0.8)" : "hsl(var(--foreground) / 0.3)",
                    borderBottom: isActive ? "2px solid hsl(var(--foreground) / 0.6)" : "2px solid transparent",
                    backgroundColor: isActive ? "hsl(var(--panel-content))" : "transparent",
                  }}
                >
                  {panel.label}
                </button>
              );
            })}
          </div>

          {/* Stacked panels — each with its own framed identity */}
          <div className="flex flex-col">
            {orderedActivePanels.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-12"
                style={{
                  backgroundColor: "hsl(var(--panel-content))",
                  boxShadow: "inset 0 2px 6px hsl(var(--panel-inset))",
                }}
              >
                <span className="text-[10px] text-foreground/20" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>No modules active</span>
                <span className="text-[8px] text-foreground/12 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Tap a module above to open</span>
              </div>
            )}
            {orderedActivePanels.map((panel) => (
              <div
                key={panel.id}
                style={{
                  borderBottom: "2px solid hsl(var(--foreground) / 0.08)",
                }}
              >
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

          {/* Mobile share + controls strip */}
          <div
            className="flex items-center gap-1.5 px-2.5"
            style={{
              paddingTop: 6,
              paddingBottom: 6,
              backgroundColor: "hsl(var(--panel-header))",
              borderTop: "2px solid hsl(var(--foreground) / 0.08)",
            }}
          >
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copied", duration: 1500 });
                } catch { toast({ title: "Copy failed", variant: "destructive", duration: 1500 }); }
              }}
              className="flex-1 flex items-center justify-center gap-1 text-foreground/35 hover:text-foreground/60 transition-colors"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "5px 0",
                backgroundColor: "hsl(var(--panel-bg))",
                border: "1px solid hsl(var(--foreground) / 0.06)",
                borderRadius: 2,
                boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
              }}
            >
              <Link2 className="w-[9px] h-[9px]" strokeWidth={2} />
              Link
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="flex-1 flex items-center justify-center gap-1 text-foreground/35 hover:text-foreground/60 transition-colors"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "5px 0",
                backgroundColor: "hsl(var(--panel-bg))",
                border: "1px solid hsl(var(--foreground) / 0.06)",
                borderRadius: 2,
                boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
              }}
            >
              <Share2 className="w-[9px] h-[9px]" strokeWidth={2} />
              Share
            </button>
            {exportAnalysisPdf && (
              <button
                onClick={() => exportAnalysisPdf(n, releaseReadiness)}
                className="flex items-center justify-center text-foreground/35 hover:text-foreground/60 transition-colors"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "5px 8px",
                  backgroundColor: "hsl(var(--panel-bg))",
                  border: "1px solid hsl(var(--foreground) / 0.06)",
                  borderRadius: 2,
                  boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
                }}
              >
                PDF
              </button>
            )}
          </div>
        </div>
        </div>

        {/* Rack bottom edge */}
        <div
          style={{
            height: 5,
            background: "linear-gradient(180deg, hsl(var(--workspace-bg)), hsl(var(--workspace-frame)))",
            boxShadow: "0 2px 6px hsl(0 0% 0% / 0.08)",
          }}
        />
      </div>

      {/* ═══ WHAT WORKS & YOUR FOCUS ═══ */}
      {(n.whatWorks.length > 0 || n.yourFocus.question) && (
        <div
          className={cn(
            "mt-2 sm:mt-3 grid gap-0",
            n.whatWorks.length > 0 && n.yourFocus.question ? "grid-cols-1 sm:grid-cols-[1fr_1fr]" : "grid-cols-1"
          )}
          style={{
            backgroundColor: "hsl(var(--workspace-bg))",
            border: "3px solid hsl(var(--foreground) / 0.12)",
            borderRadius: 4,
            boxShadow: "inset 0 2px 6px hsl(var(--panel-inset)), 0 4px 16px hsl(0 0% 0% / 0.08)",
            overflow: "hidden",
          }}
        >
          {n.whatWorks.length > 0 && (
            <div
              className="flex flex-col"
              style={{
                borderRight: n.yourFocus.question ? "2px solid hsl(var(--foreground) / 0.08)" : "none",
              }}
            >
              {/* Section header strip */}
              <div
                className="flex items-center gap-2 px-4"
                style={{
                  paddingTop: 6,
                  paddingBottom: 6,
                  backgroundColor: "hsl(var(--panel-header))",
                  borderBottom: "2px solid hsl(var(--foreground) / 0.08)",
                }}
              >
                <div
                  className="w-[6px] h-[6px] rounded-full shrink-0"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, hsl(var(--foreground) / 0.2), hsl(var(--foreground) / 0.06))",
                    boxShadow: "inset 0 0.5px 1px hsl(0 0% 100% / 0.15), 0 0 0 0.5px hsl(var(--foreground) / 0.06)",
                  }}
                />
                <h3
                  className="text-[8px] text-foreground/50 tracking-[0.16em] uppercase font-extrabold"
                  style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
                >
                  {modeWhatWorksLabel[mode] || "What Works"}
                </h3>
              </div>
              <div className="p-3 space-y-1.5 flex-1 flex flex-col" style={{ backgroundColor: "hsl(var(--panel-content))" }}>
                {n.whatWorks.map((item, i) => {
                  const tags = detectTags(`${item.title} ${item.description || ""}`);
                  return (
                    <div
                      key={i}
                      className="flex-1 p-3"
                      style={{
                        backgroundColor: "hsl(var(--panel-bg))",
                        border: "1px solid hsl(var(--foreground) / 0.07)",
                        borderRadius: 2,
                        boxShadow: "inset 0 1px 3px hsl(var(--panel-inset))",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[13px] font-semibold tracking-tight text-foreground/85">{item.title}</h4>
                        {tags.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block border px-2 py-0.5 text-foreground/45"
                                style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: 8,
                                  letterSpacing: "0.06em",
                                  borderColor: "hsl(var(--foreground) / 0.08)",
                                  borderRadius: 2,
                                  textTransform: "uppercase",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[12px] text-foreground/60 mt-1.5" style={{ lineHeight: 1.6, fontFamily: "'IBM Plex Mono', monospace" }}>{item.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {n.yourFocus.question && (
            <div className="flex flex-col">
              {/* Section header strip */}
              <div
                className="flex items-center gap-2 px-4"
                style={{
                  paddingTop: 6,
                  paddingBottom: 6,
                  backgroundColor: "hsl(var(--panel-header))",
                  borderBottom: "2px solid hsl(var(--foreground) / 0.08)",
                }}
              >
                <div
                  className="w-[6px] h-[6px] rounded-full shrink-0"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, hsl(var(--foreground) / 0.2), hsl(var(--foreground) / 0.06))",
                    boxShadow: "inset 0 0.5px 1px hsl(0 0% 100% / 0.15), 0 0 0 0.5px hsl(var(--foreground) / 0.06)",
                  }}
                />
                <h3
                  className="text-[8px] text-foreground/50 tracking-[0.16em] uppercase font-extrabold"
                  style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
                >
                  Your Focus
                </h3>
              </div>
              <div className="flex-1 flex flex-col gap-3 p-3" style={{ backgroundColor: "hsl(var(--panel-content))" }}>
                <div
                  className="p-3"
                  style={{
                    backgroundColor: "hsl(var(--panel-bg))",
                    border: "1px solid hsl(var(--foreground) / 0.07)",
                    borderRadius: 2,
                    boxShadow: "inset 0 1px 3px hsl(var(--panel-inset))",
                  }}
                >
                  <p
                    className="text-foreground/35 uppercase tracking-[0.1em] mb-1 font-extrabold"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7.5 }}
                  >You asked</p>
                  <p className="text-[13px] text-foreground/70 italic" style={{ lineHeight: 1.6 }}>
                    &ldquo;{n.yourFocus.question}&rdquo;
                  </p>
                </div>
                <div
                  className="p-3"
                  style={{
                    backgroundColor: "hsl(var(--panel-bg))",
                    border: "1px solid hsl(var(--foreground) / 0.07)",
                    borderRadius: 2,
                    boxShadow: "inset 0 1px 3px hsl(var(--panel-inset))",
                  }}
                >
                  <p
                    className="text-foreground/35 uppercase tracking-[0.1em] mb-1 font-extrabold"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7.5 }}
                  >Response</p>
                  <p className="text-[12px] text-foreground/60" style={{ lineHeight: 1.65, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {n.yourFocus.response || "No direct focus response available for this run."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ARRANGEMENT — bottom of page, compact ═══ */}
      <div
        ref={arrangementRef}
        className={cn(
          "mt-4 rounded-md border border-[#3A3F47] p-0 transition-all duration-200 overflow-hidden",
          !showArrangement && "hidden"
        )}
      >
        <AlsAnalyzer
          onLoaded={() => {
            arrangementRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>

      {/* ═══ WORKSTATION CLOSING FRAME ═══ */}
      <div
        className="mt-2 sm:mt-3"
        style={{
          backgroundColor: "hsl(0 0% 8%)",
          border: "2px solid hsl(var(--foreground) / 0.1)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Machined top edge */}
        <div style={{ height: 1, background: "hsl(0 0% 100% / 0.04)" }} />
        <div style={{ height: 1, background: "hsl(0 0% 0% / 0.3)" }} />

        <div className="px-4 sm:px-5 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left: wordmark + trust */}
            <div className="flex flex-col gap-1.5">
              <span
                className="tracking-tight font-bold"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "hsl(0 0% 40%)",
                }}
              >
                SecondEar™
              </span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: "hsl(145 40% 45% / 0.6)" }}
                />
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8,
                    letterSpacing: "0.08em",
                    color: "hsl(0 0% 35%)",
                    textTransform: "uppercase",
                  }}
                >
                  Private by default · Not used for AI training
                </span>
              </div>
            </div>

            {/* Right: links */}
            <div className="flex items-center gap-3">
              {[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ].map((link, i) => (
                <span key={link.href} className="flex items-center gap-3">
                  {i > 0 && (
                    <span style={{ color: "hsl(0 0% 20%)" }}>·</span>
                  )}
                  <a
                    href={link.href}
                    className="transition-colors"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 8.5,
                      letterSpacing: "0.06em",
                      color: "hsl(0 0% 38%)",
                    }}
                  >
                    {link.label}
                  </a>
                </span>
              ))}
              <span style={{ color: "hsl(0 0% 20%)" }}>·</span>
              <a
                href="mailto:hello@secondears.io"
                className="transition-colors"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8.5,
                  letterSpacing: "0.06em",
                  color: "hsl(0 0% 38%)",
                }}
              >
                hello@secondears.io
              </a>
            </div>
          </div>
        </div>

        {/* Bottom edge line */}
        <div style={{ height: 1, background: "hsl(0 0% 100% / 0.03)" }} />
      </div>
    </div>
  );
};

export default FeedbackDisplay;

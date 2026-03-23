import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Upload, Music, SlidersHorizontal, Ear, Target, Disc3, CheckCircle2, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import { getAuthHeaders, BACKEND } from "@/lib/backendFetch";
import { compressAudio } from "@/lib/compressAudio";
import type { ListeningMode, FeedbackResult } from "@/pages/Analyze";

const modes: { id: ListeningMode; label: string; tag: string; icon: typeof SlidersHorizontal }[] = [
  { id: "technical", label: "Technical", tag: "The engineer", icon: SlidersHorizontal },
  { id: "musical", label: "Musical", tag: "The producer", icon: Music },
  { id: "perception", label: "Perception", tag: "The listener", icon: Ear },
];

type Goal = "mixing" | "mastering" | "release_check";
const goals: { id: Goal; label: string; icon: typeof Target }[] = [
  { id: "mixing", label: "Mixing", icon: Disc3 },
  { id: "mastering", label: "Mastering", icon: Target },
  { id: "release_check", label: "Release check", icon: CheckCircle2 },
];

const modeTooltips: Record<ListeningMode, string> = {
  technical: "Analyzes loudness, dynamics, frequency balance, stereo image and mix translation. Best for engineers and producers focused on technical fixes.",
  musical: "Analyzes arrangement, section contrast, hook clarity, groove and emotional momentum. Best for producers evaluating the song itself.",
  perception: "Analyzes how the mix translates on real speakers, listener fatigue, psychoacoustics and playback compatibility. Best for pre-release checks.",
};

const goalTooltips: Record<Goal, string> = {
  mixing: "Focuses on element balance, separation and relative levels. No mastering advice — purely about the mix.",
  mastering: "Focuses on loudness targets, limiting, dynamics and streaming compliance (-14 LUFS / -9 to -11 LUFS for club).",
  release_check: "Focuses on streaming compliance, true peak (below -1 dBTP), translation across systems and release readiness.",
};

interface Props {
  onResult: (result: FeedbackResult) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  onProgressStep?: (step: number) => void;
  onError?: (msg: string) => void;
  defaultMode?: ListeningMode;
  onTrackName?: (name: string) => void;
}

const TrackUploader = ({ onResult, isAnalyzing, setIsAnalyzing, onProgressStep, onError, defaultMode, onTrackName }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ListeningMode>(defaultMode || "technical");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState<Goal>("mixing");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [lockedModeTooltip, setLockedModeTooltip] = useState<string | null>(null);

  const isDark = useMemo(() => {
    return typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  }, []);

  // Fetch user plan on mount
  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND}/api/usage`, { headers });
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan || "free");
        }
      } catch { /* default to free */ }
    })();
  }, []);

  // Reset state on mount so returning to this page is always fresh
  useEffect(() => {
    setFile(null);
    setContext("");
    setGoal("mixing");
    setDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const MAX_FILE_SIZE = 200 * 1024 * 1024;

  const validateAndSetFile = useCallback((f: File) => {
    if (!f.type.startsWith("audio/")) {
      toast({ title: "Please upload an audio file", variant: "destructive", duration: 2500 });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
      toast({ title: "Archivo muy grande", description: `El archivo pesa ${sizeMB} MB. El límite es 200 MB.`, variant: "destructive", duration: 3500 });
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, [validateAndSetFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND}/api/stripe/checkout`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Checkout failed (${res.status})`);
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Error starting checkout", description: err.message, variant: "destructive" });
      setUpgradeLoading(false);
    }
  };

  const analyze = async () => {
    if (!file) return;

    // Check usage limit before uploading
    try {
      const headers = await getAuthHeaders();
      if (headers["Authorization"]) {
        const usageRes = await fetch(`${BACKEND}/api/usage`, { headers });
        if (usageRes.ok) {
          const usage = await usageRes.json();
          if (usage.plan === "free" && usage.remaining === 0) {
            setShowUpgradeModal(true);
            return;
          }
        }
      }
    } catch (_) { /* don't block analysis on usage check failure */ }

    setIsAnalyzing(true);
    onTrackName?.(file.name);
    onProgressStep?.(0);
    try {
      const fileToUpload = await compressAudio(file);
      const storagePath = `${Date.now()}-${fileToUpload.name}`;
      const { error: uploadError } = await supabase.storage.from("tracks").upload(storagePath, fileToUpload);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      onProgressStep?.(1);
      const { data: signedData, error: signedError } = await supabase.storage.from("tracks").createSignedUrl(storagePath, 3600);
      if (signedError) console.warn("[TrackUploader] Signed URL failed:", signedError.message);
      const fullSignedUrl = signedData?.signedUrl
        ? (signedData.signedUrl.startsWith("http") ? signedData.signedUrl : `https://nllfubvokhybmtnnqeuk.supabase.co/storage/v1${signedData.signedUrl}`)
        : undefined;
      onProgressStep?.(2);

      const authHeaders = await getAuthHeaders();
      const feedbackRes = await fetch(`${BACKEND}/api/feedback`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: fullSignedUrl, fileName: file.name, mode, userContext: context.trim() || undefined, goal }),
      });
      if (!feedbackRes.ok) {
        const errData = await feedbackRes.json().catch(() => ({}));
        if (feedbackRes.status === 403 && errData.error === "limit_reached") {
          setShowUpgradeModal(true);
          setIsAnalyzing(false);
          return;
        }
        if (feedbackRes.status === 429 && errData.error === "cooldown_active") {
          const nextAvailable = errData.nextAvailableAt;
          if (nextAvailable) {
            const hoursLeft = Math.ceil((new Date(nextAvailable).getTime() - Date.now()) / (1000 * 60 * 60));
            const msg = hoursLeft > 1
              ? `Tu próximo análisis estará disponible en ${hoursLeft} horas`
              : "Tu próximo análisis estará disponible en menos de 1 hora";
            setCooldownMessage(msg);
          } else {
            setCooldownMessage("Cooldown activo. Intentá de nuevo más tarde.");
          }
          setIsAnalyzing(false);
          return;
        }
        throw new Error(`Backend error: ${feedbackRes.status}`);
      }
      const initialRes = await feedbackRes.json();

      // If backend returns a jobId, poll for results
      let result: any;
      if (initialRes.jobId) {
        const POLL_INTERVAL = 4000;
        const MAX_POLLS = 90; // 6 min max
        let polls = 0;
        while (polls < MAX_POLLS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL));
          polls++;
          const statusRes = await fetch(
            `${BACKEND}/api/feedback/status/${initialRes.jobId}`,
            { headers: authHeaders }
          );
          if (!statusRes.ok) throw new Error(`Status check failed: ${statusRes.status}`);
          const statusData = await statusRes.json();
          console.log("[poll] raw:", JSON.stringify(statusData));
          if (statusData.status === "done") {
            console.log("[poll] done - result keys:", Object.keys(statusData.result || {}));
            console.log("[poll] feedback:", JSON.stringify(statusData.result?.feedback));
            result = statusData.result;
            break;
          }
          if (statusData.status === "error") {
            const errMsg = (statusData.error || "").toLowerCase();
            let userMessage: string;
            if (errMsg.includes("too short")) {
              userMessage = "El track es muy corto. Se necesitan al menos 10 segundos.";
            } else if (errMsg.includes("too large")) {
              userMessage = "El archivo es muy grande. Máximo 150MB.";
            } else if (errMsg.includes("download")) {
              userMessage = "No se pudo descargar el audio. Intentá subirlo de nuevo.";
            } else {
              userMessage = "Hubo un error analizando tu track. Intentá de nuevo.";
            }
            throw new Error(userMessage);
          }
          // still processing — continue polling
        }
        if (!result) throw new Error("Analysis timed out. Please try again.");
      } else {
        // Legacy: backend returned result directly
        result = initialRes;
      }

      onProgressStep?.(3);
      const normalized = normalizeFeedbackResponse(result, mode, context.trim() || undefined, file.name);
      // Give step 3 "Finalizing" enough time to animate to ~95%+ before switching view
      await new Promise((r) => setTimeout(r, 1800));
      onResult({ normalized, rawResult: result, audioFile: file, storagePath });
    } catch (err: any) {
      const msg = err.message || "Something went wrong. Please try again.";
      onError?.(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        id="track-file-input"
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.flac,audio/*"
        onChange={handleFileChange}
        className="sr-only"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="cursor-pointer flex flex-col items-center justify-center gap-3 select-none transition-all duration-150"
        style={{
          minHeight: 160,
          padding: "40px 24px",
          backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
          border: dragOver
            ? (isDark ? "2px dashed #e8e8e0" : "2px dashed #111")
            : file
              ? (isDark ? "2px solid #333" : "2px solid hsl(0 0% 0% / 0.15)")
              : (isDark ? "2px dashed #333" : "2px dashed #c8c8c4"),
          borderRadius: 6,
          boxShadow: isDark ? "none" : "inset 0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {file ? (
          <>
            <Music className="w-8 h-8" style={{ color: "#999" }} />
            <div className="text-center">
              <p style={{ fontSize: 16, fontWeight: 500, color: isDark ? "#e8e8e0" : "#333", fontFamily: "'IBM Plex Mono', monospace" }}>{file.name}</p>
              <p style={{ fontSize: 12, color: isDark ? "#666" : "#aaa", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8" style={{ color: "#999" }} />
            <div className="text-center">
              <p style={{ fontSize: 16, fontWeight: 500, color: isDark ? "#e8e8e0" : "#333", fontFamily: "'IBM Plex Mono', monospace" }}>Drop your track here</p>
              <p style={{ fontSize: 12, color: isDark ? "#666" : "#aaa", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>or click to browse · MP3, WAV, FLAC</p>
            </div>
          </>
        )}
      </div>
      <div>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && file && !isAnalyzing) { e.preventDefault(); analyze(); } }}
          placeholder="What are you going for?"
          className="w-full focus:outline-none"
          style={{
            height: 48,
            border: isDark ? "1px solid #333" : "1px solid #ddd",
            borderRadius: 6,
            fontSize: 14,
            padding: "0 16px",
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            color: isDark ? "#e8e8e0" : "#333",
            fontFamily: "'IBM Plex Mono', monospace",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = isDark ? "#e8e8e0" : "#111"; e.currentTarget.style.boxShadow = isDark ? "0 0 0 2px rgba(255,255,255,0.06)" : "0 0 0 2px rgba(0,0,0,0.04)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? "#333" : "#ddd"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <p className="text-[9px] text-foreground/30 mt-1 ml-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Optional: references, goals, or specific concerns.</p>
      </div>
      <div>
        <p
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#999", textTransform: "uppercase" as const, marginBottom: 10, fontWeight: 700 }}
        >
          Listening mode
        </p>
        <TooltipProvider>
        <div className="grid grid-cols-3 gap-1.5">
          {modes.map((m) => {
            const isLocked = userPlan === "free" && m.id !== "technical";
            return (
              <Tooltip key={m.id} delayDuration={300}>
                <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (isLocked) {
                    setLockedModeTooltip(m.id);
                    setTimeout(() => setLockedModeTooltip(null), 2500);
                    return;
                  }
                  setMode(m.id);
                }}
                className="relative text-left transition-all duration-150"
                style={{
                  padding: "12px 14px",
                  backgroundColor: !isLocked && mode === m.id
                    ? (isDark ? "#e8e8e0" : "#111")
                    : (isDark ? "#1a1a1a" : "#ffffff"),
                  color: !isLocked && mode === m.id
                    ? (isDark ? "#111" : "#ffffff")
                    : (isDark ? "#888" : "#333"),
                  border: !isLocked && mode === m.id
                    ? (isDark ? "1px solid #e8e8e0" : "1px solid #111")
                    : (isDark ? "1px solid #2a2a2a" : "1px solid #e0e0e0"),
                  borderRadius: 6,
                  opacity: isLocked ? 0.4 : 1,
                  cursor: isLocked ? "default" : "pointer",
                }}
                onMouseEnter={(e) => { if (!isLocked && mode !== m.id) { e.currentTarget.style.borderColor = isDark ? "#555" : "#999"; e.currentTarget.style.backgroundColor = isDark ? "#222" : "#fafafa"; } }}
                onMouseLeave={(e) => { if (!isLocked && mode !== m.id) { e.currentTarget.style.borderColor = isDark ? "#2a2a2a" : "#e0e0e0"; e.currentTarget.style.backgroundColor = isDark ? "#1a1a1a" : "#ffffff"; } }}
              >
                {isLocked && (
                  <span
                    className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
                    style={{
                      backgroundColor: "hsl(var(--foreground) / 0.08)",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 8,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      color: "hsl(var(--foreground) / 0.5)",
                    }}
                  >
                    <Lock className="w-2.5 h-2.5" /> PRO
                  </span>
                )}
                <m.icon className="w-3.5 h-3.5 mb-1.5" style={{ color: !isLocked && mode === m.id ? (isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)") : "hsl(var(--foreground) / 0.5)" }} />
                <p className="text-[11px] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{m.label}</p>
                <p className="text-[9px] mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: !isLocked && mode === m.id ? (isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)") : "#999" }}>{m.tag}</p>
                {isLocked && lockedModeTooltip === m.id && (
                  <span
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-sm z-10 animate-fade-in"
                    style={{
                      backgroundColor: "hsl(var(--foreground))",
                      color: "hsl(var(--background))",
                      fontSize: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    Disponible en el plan <a href="/#pricing" className="underline font-bold">Pro</a>
                  </span>
                )}
              </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs" style={{ backgroundColor: "hsl(0 0% 10%)", color: "hsl(0 0% 96%)", border: "1px solid hsl(0 0% 20%)" }}>
                  {modeTooltips[m.id]}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        </TooltipProvider>
      </div>
      <div>
        <p
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#999", textTransform: "uppercase" as const, marginBottom: 10, fontWeight: 700 }}
        >
          Goal
        </p>
        <TooltipProvider>
        <div className="grid grid-cols-3 gap-1.5">
          {goals.map((g) => (
            <Tooltip key={g.id} delayDuration={300}>
              <TooltipTrigger asChild>
            <button onClick={() => setGoal(g.id)}
              className="text-left transition-all duration-150"
              style={{
                padding: "12px 14px",
                backgroundColor: goal === g.id
                  ? (isDark ? "#e8e8e0" : "#111")
                  : (isDark ? "#1a1a1a" : "#ffffff"),
                color: goal === g.id
                  ? (isDark ? "#111" : "#ffffff")
                  : (isDark ? "#888" : "#333"),
                border: goal === g.id
                  ? (isDark ? "1px solid #e8e8e0" : "1px solid #111")
                  : (isDark ? "1px solid #2a2a2a" : "1px solid #e0e0e0"),
                borderRadius: 6,
              }}
              onMouseEnter={(e) => { if (goal !== g.id) { e.currentTarget.style.borderColor = isDark ? "#555" : "#999"; e.currentTarget.style.backgroundColor = isDark ? "#222" : "#fafafa"; } }}
              onMouseLeave={(e) => { if (goal !== g.id) { e.currentTarget.style.borderColor = isDark ? "#2a2a2a" : "#e0e0e0"; e.currentTarget.style.backgroundColor = isDark ? "#1a1a1a" : "#ffffff"; } }}
            >
              <g.icon className="w-3.5 h-3.5 mb-1.5" style={{ color: goal === g.id ? (isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)") : "#999" }} />
              <p className="text-[11px] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{g.label}</p>
            </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-xs" style={{ backgroundColor: "hsl(0 0% 10%)", color: "hsl(0 0% 96%)", border: "1px solid hsl(0 0% 20%)" }}>
                {goalTooltips[g.id]}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        </TooltipProvider>
      </div>
      {cooldownMessage && (
        <div
          className="w-full px-4 py-3 border border-foreground/10 bg-muted/50 text-center"
          style={{ borderRadius: 3 }}
        >
          <p className="text-[11px] text-foreground/60 font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            ⏳ {cooldownMessage}
          </p>
        </div>
      )}
      <Button
        variant="default"
        size="lg"
        className="w-full font-bold uppercase"
        style={{ height: 52, fontSize: 13, letterSpacing: "0.08em", borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace" }}
        disabled={!file || isAnalyzing || !!cooldownMessage}
        onClick={analyze}
      >
        {isAnalyzing ? "Analyzing…" : "Analyze my mix"}
      </Button>

      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="relative w-full max-w-sm mx-4 bg-card border border-foreground/10 shadow-xl"
            style={{ borderRadius: 3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[13px] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Límite alcanzado
                </p>
                <p className="text-[11px] text-foreground/50 mt-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Usaste tus 3 análisis gratuitos este mes.
                </p>
              </div>
              <Button
                className="w-full h-10 text-[11px] font-bold tracking-[0.06em] uppercase"
                style={{ borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace" }}
                disabled={upgradeLoading}
                onClick={handleUpgrade}
              >
                {upgradeLoading ? "Redirigiendo…" : "Upgrade a Pro — $9/mes"}
              </Button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full text-[10px] text-foreground/30 hover:text-foreground/60 transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackUploader;

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, User, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface Comment {
  id: string;
  analysis_id: string;
  user_id: string;
  timestamp_in_track: number;
  text: string;
  created_at: string;
}

interface Props {
  analysisId: string | null;
  currentTime?: number;
  onAddToDo?: (text: string, timestampSec: number) => void;
  pendingComment?: { text: string; timestampSec: number } | null;
  onPendingCommentHandled?: () => void;
}

const HumanFeedbackPanel = ({ analysisId, currentTime = 0, onAddToDo, pendingComment, onPendingCommentHandled }: Props) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!analysisId) { setLoadingComments(false); return; }
    const load = async () => {
      setLoadingComments(true);
      const { data } = await supabase
        .from("comments")
        .select("id, analysis_id, user_id, timestamp_in_track, text, created_at")
        .eq("analysis_id", analysisId)
        .order("created_at", { ascending: true });
      if (data) setComments(data as unknown as Comment[]);
      setLoadingComments(false);
    };
    load();
  }, [analysisId, user]);

  useEffect(() => {
    if (!pendingComment || !analysisId || !user) return;
    const insert = async () => {
      const comment = {
        analysis_id: analysisId,
        user_id: user.id,
        timestamp_in_track: pendingComment.timestampSec,
        text: pendingComment.text,
      };
      const { data, error } = await supabase.from("comments").insert(comment).select().single();
      if (!error && data) {
        setComments((prev) => [...prev, data as unknown as Comment]);
        toast({ title: "Comment added", duration: 1200 });
      }
      onPendingCommentHandled?.();
    };
    insert();
  }, [pendingComment, analysisId, user, onPendingCommentHandled]);

  const handleSubmit = useCallback(async () => {
    const trimmed = newText.trim();
    if (!trimmed || !analysisId || !user) return;
    const comment = { analysis_id: analysisId, user_id: user.id, timestamp_in_track: currentTime, text: trimmed };
    const { data, error } = await supabase.from("comments").insert(comment).select().single();
    if (error) { toast({ title: "Failed to save", variant: "destructive", duration: 1500 }); return; }
    setComments((prev) => [...prev, data as unknown as Comment]);
    setNewText("");
    inputRef.current?.focus();
  }, [newText, analysisId, user, currentTime]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input — console style */}
      <div
        className="p-3.5"
        style={{
          borderBottom: "1px solid hsl(var(--foreground) / 0.08)",
          boxShadow: "inset 0 -1px 0 hsl(0 0% 100% / 0.02)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-foreground/20" style={{ fontFamily: MONO, fontSize: 13 }}>›</span>
          <span
            className="text-foreground/35 tabular-nums font-medium"
            style={{ fontFamily: MONO, fontSize: 12 }}
          >
            @{formatTime(currentTime)}
          </span>
        </div>
        <textarea
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add note…"
          rows={2}
          className="w-full bg-transparent text-[14px] text-foreground/65 placeholder:text-foreground/20 outline-none resize-none"
          style={{ fontFamily: MONO, lineHeight: 1.65 }}
        />
        <div className="flex justify-end mt-1">
          <button
            onClick={handleSubmit}
            disabled={!newText.trim() || !analysisId}
            className="text-[10px] uppercase tracking-[0.08em] font-medium text-foreground/40 hover:text-foreground/65 transition-colors disabled:opacity-20"
            style={{ fontFamily: MONO }}
          >
            <Plus className="w-3.5 h-3.5 inline mr-0.5" />
            Add
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
        {loadingComments && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-[9px] text-foreground/20 animate-pulse" style={{ fontFamily: MONO }}>Loading…</p>
          </div>
        )}
        {!loadingComments && comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
            <MessageSquare className="w-6 h-6 text-foreground/10" strokeWidth={1.5} />
            <p className="text-[11px] text-foreground/30 uppercase tracking-wider font-medium" style={{ fontFamily: MONO }}>
              No notes yet
            </p>
            <p className="text-[11px] text-foreground/20 max-w-[200px]" style={{ fontFamily: MONO, lineHeight: 1.6 }}>
              Click waveform to add timestamped notes
            </p>
          </div>
        )}
        {comments.map((c, idx) => (
          <div
            key={c.id}
            className="group px-4 py-3.5 transition-colors hover:bg-foreground/[0.02]"
            style={{
              borderBottom: idx < comments.length - 1 ? "1px solid hsl(var(--foreground) / 0.04)" : "none",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-[18px] h-[18px] rounded-[2px] flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "hsl(var(--foreground) / 0.06)",
                  border: "1px solid hsl(var(--foreground) / 0.06)",
                }}
              >
                <User className="w-[10px] h-[10px] text-foreground/25" />
              </div>
              <span
                className="text-foreground/40 tabular-nums font-medium"
                style={{ fontFamily: MONO, fontSize: 12 }}
              >
                @{formatTime(c.timestamp_in_track)}
              </span>
              <span className="text-foreground/22" style={{ fontFamily: MONO, fontSize: 11 }}>
                {formatDate(c.created_at)}
              </span>
            </div>
            <p
              className="text-[14px] text-foreground/60 ml-[26px]"
              style={{ fontFamily: MONO, lineHeight: 1.7 }}
            >
              {c.text}
            </p>
            {onAddToDo && (
              <button
                onClick={() => onAddToDo(c.text, c.timestamp_in_track)}
                className="opacity-0 group-hover:opacity-100 ml-[26px] mt-1.5 text-[10px] uppercase tracking-wider font-medium text-foreground/25 hover:text-foreground/50 transition-all"
                style={{ fontFamily: MONO }}
              >
                <Plus className="w-3 h-3 inline mr-0.5" />
                todo
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HumanFeedbackPanel;

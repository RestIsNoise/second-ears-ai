import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, User, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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
  timestamp: number;
  content: string;
  created_at: string;
}

type RawComment = Partial<Comment> & {
  text?: string;
  timestamp_in_track?: number;
};

const normalizeComment = (raw: RawComment): Comment => ({
  id: raw.id ?? crypto.randomUUID(),
  analysis_id: raw.analysis_id ?? "",
  user_id: raw.user_id ?? "",
  content: raw.content ?? raw.text ?? "",
  timestamp: Number(raw.timestamp ?? raw.timestamp_in_track ?? 0),
  created_at: raw.created_at ?? new Date().toISOString(),
});

interface Props {
  analysisId: string | null;
  currentTime?: number;
  onAddToDo?: (text: string, timestampSec: number) => void;
  pendingComment?: { text: string; timestampSec: number } | null;
  onPendingCommentHandled?: () => void;
  onCommentsChange?: (comments: { id: string; content: string; timestamp: number }[]) => void;
}

const HumanFeedbackPanel = ({ analysisId, currentTime = 0, onAddToDo, pendingComment, onPendingCommentHandled, onCommentsChange }: Props) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getCurrentUserId = useCallback(async () => {
    if (user?.id) return user.id;
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }, [user?.id]);

  // Sync comment markers to parent
  useEffect(() => {
    onCommentsChange?.(comments.map(c => ({ id: c.id, content: c.content, timestamp: c.timestamp })));
  }, [comments, onCommentsChange]);

  // Load comments
  useEffect(() => {
    if (!analysisId) { setLoadingComments(false); return; }
    const load = async () => {
      setLoadingComments(true);
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("analysis_id", analysisId)
        .order("created_at", { ascending: true });
      if (data) setComments((data as RawComment[]).map(normalizeComment));
      setLoadingComments(false);
    };
    load();
  }, [analysisId, user]);

  // Handle external comments from waveform "Add Note"
  useEffect(() => {
    if (!pendingComment || !analysisId) return;
    const insert = async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast({ title: "Please sign in to add comments", variant: "destructive", duration: 1500 });
        onPendingCommentHandled?.();
        return;
      }

      const nowIso = new Date().toISOString();
      const row = {
        id: crypto.randomUUID(),
        analysis_id: analysisId,
        user_id: userId,
        timestamp: pendingComment.timestampSec,
        content: pendingComment.text,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const { error } = await supabase
        .from("comments")
        .insert(row as any);

      if (error) {
        toast({ title: error.message || "Failed to save comment", variant: "destructive", duration: 1800 });
      } else {
        setComments((prev) => [...prev, normalizeComment(row)]);
        toast({ title: "Comment added", duration: 1200 });
      }

      onPendingCommentHandled?.();
    };
    insert();
  }, [pendingComment, analysisId, getCurrentUserId, onPendingCommentHandled]);

  const handleSubmit = useCallback(async () => {
    const trimmed = newText.trim();
    if (!trimmed || !analysisId) return;

    const userId = await getCurrentUserId();
    if (!userId) {
      toast({ title: "Please sign in to add comments", variant: "destructive", duration: 1500 });
      return;
    }

    const nowIso = new Date().toISOString();
    const row = {
      id: crypto.randomUUID(),
      analysis_id: analysisId,
      user_id: userId,
      timestamp: currentTime,
      content: trimmed,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { error } = await supabase
      .from("comments")
      .insert(row as any);

    if (error) {
      toast({ title: error.message || "Failed to save comment", variant: "destructive", duration: 1800 });
      return;
    }

    setComments((prev) => [...prev, normalizeComment(row)]);
    setNewText("");
    inputRef.current?.focus();
  }, [newText, analysisId, currentTime, getCurrentUserId]);

  const handleDelete = useCallback(async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) {
      toast({ title: "Failed to delete comment", variant: "destructive", duration: 1500 });
      if (analysisId) {
        const { data } = await supabase
          .from("comments")
          .select("*")
          .eq("analysis_id", analysisId)
          .order("created_at", { ascending: true });
        if (data) setComments((data as RawComment[]).map(normalizeComment));
      }
    }
  }, [analysisId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="p-3 border-b border-border-subtle">
        <textarea
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Add comment at ${formatTime(currentTime)}…`}
          rows={2}
          className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span
            className="text-muted-foreground/40 tabular-nums"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
          >
            @{formatTime(currentTime)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSubmit}
            disabled={!newText.trim() || !analysisId}
            className="h-6 text-[10px] gap-1 text-muted-foreground/50 hover:text-foreground"
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1 scrollbar-thin">
        {loadingComments && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-muted-foreground/50 animate-pulse">Loading comments…</p>
          </div>
        )}
        {!loadingComments && comments.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center gap-3" style={{ padding: "32px 16px" }}>
            <MessageSquare className="w-6 h-6" style={{ color: "#ccc" }} strokeWidth={1.5} />
            <p style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6, maxWidth: 240 }}>
              Click anywhere on the waveform to leave a note.
            </p>
          </div>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="group"
            style={{
              background: "#ffffff",
              border: "1px solid #e8e8e8",
              borderRadius: 6,
              padding: "14px 16px",
              marginBottom: 8,
            }}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    background: "#f0f0f0",
                    color: "#666",
                    padding: "2px 8px",
                    borderRadius: 3,
                    marginBottom: 8,
                  }}
                >
                  @{formatTime(c.timestamp)}
                </span>
                <p style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
                  {c.content}
                </p>
                <p style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>
                  {formatDate(c.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                {onAddToDo && (
                  <button
                    onClick={() => onAddToDo(c.content, c.timestamp)}
                    className="opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: "#bbb" }}
                    title="Add to To-Do"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
                {user && user.id === c.user_id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: "#bbb" }}
                    title="Delete comment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HumanFeedbackPanel;

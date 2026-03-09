import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import CommentVoteButtons from "@/components/CommentVoteButtons";

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
  upvotes: number;
  downvotes: number;
}

interface UserVoteMap {
  [commentId: string]: 1 | -1;
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
  const [userVotes, setUserVotes] = useState<UserVoteMap>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load comments + user votes
  useEffect(() => {
    if (!analysisId) { setLoadingComments(false); return; }
    const load = async () => {
      setLoadingComments(true);
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("analysis_id", analysisId)
        .order("created_at", { ascending: true });
      if (data) setComments(data as unknown as Comment[]);

      // Load user's votes
      if (user) {
        const commentIds = (data || []).map((c: any) => c.id);
        if (commentIds.length > 0) {
          const { data: votes } = await supabase
            .from("comment_votes" as any)
            .select("comment_id, vote")
            .eq("user_id", user.id)
            .in("comment_id", commentIds);
          if (votes) {
            const map: UserVoteMap = {};
            (votes as any[]).forEach((v) => { map[v.comment_id] = v.vote as 1 | -1; });
            setUserVotes(map);
          }
        }
      }
      setLoadingComments(false);
    };
    load();
  }, [analysisId, user]);

  // Handle external comments from waveform "Add Note"
  useEffect(() => {
    if (!pendingComment || !analysisId || !user) return;
    const insert = async () => {
      const comment = {
        analysis_id: analysisId,
        user_id: user.id,
        timestamp_in_track: pendingComment.timestampSec,
        text: pendingComment.text,
      };
      const { data, error } = await supabase
        .from("comments")
        .insert(comment)
        .select()
        .single();
      if (!error && data) {
        setComments((prev) => [...prev, { ...data, upvotes: 0, downvotes: 0 } as unknown as Comment]);
        toast({ title: "Comment added", duration: 1200 });
      }
      onPendingCommentHandled?.();
    };
    insert();
  }, [pendingComment, analysisId, user, onPendingCommentHandled]);

  const handleSubmit = useCallback(async () => {
    const trimmed = newText.trim();
    if (!trimmed || !analysisId || !user) return;

    const comment = {
      analysis_id: analysisId,
      user_id: user.id,
      timestamp_in_track: currentTime,
      text: trimmed,
    };

    const { data, error } = await supabase
      .from("comments")
      .insert(comment)
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to save comment", variant: "destructive", duration: 1500 });
      return;
    }

    setComments((prev) => [...prev, { ...data, upvotes: 0, downvotes: 0 } as unknown as Comment]);
    setNewText("");
    inputRef.current?.focus();
  }, [newText, analysisId, user, currentTime]);

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
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
            <MessageSquare className="w-10 h-10 text-muted-foreground/25" strokeWidth={1.5} />
            <div className="space-y-1.5">
              <p className="text-[15px] font-medium text-foreground/50 tracking-tight">No notes yet</p>
              <p className="text-[12px] text-muted-foreground/40 leading-relaxed max-w-[220px]">
                Click on the waveform at any point to add a timestamped comment
              </p>
            </div>
          </div>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="rounded-lg p-2.5 hover:bg-secondary/30 transition-colors group"
          >
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-muted-foreground tabular-nums"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
                  >
                    @{formatTime(c.timestamp_in_track)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">
                    {formatDate(c.created_at)}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
                  {c.text}
                </p>
                {/* Vote buttons */}
                <div className="mt-1">
                  <CommentVoteButtons
                    commentId={c.id}
                    userId={user?.id}
                    initialUpvotes={c.upvotes ?? 0}
                    initialDownvotes={c.downvotes ?? 0}
                    initialUserVote={userVotes[c.id] ?? null}
                  />
                </div>
              </div>
              {onAddToDo && (
                <button
                  onClick={() => onAddToDo(c.text, c.timestamp_in_track)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground/40 hover:text-foreground/60 transition-all shrink-0 mt-0.5"
                  title="Add to To-Do"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HumanFeedbackPanel;

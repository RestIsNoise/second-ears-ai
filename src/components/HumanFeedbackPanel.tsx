import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { ToDoItem } from "@/types/feedback";

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
}

const HumanFeedbackPanel = ({ analysisId, currentTime = 0, onAddToDo }: Props) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load comments
  useEffect(() => {
    if (!analysisId) return;
    const load = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("analysis_id", analysisId)
        .order("created_at", { ascending: true });
      if (data) setComments(data as Comment[]);
    };
    load();
  }, [analysisId]);

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

    setComments((prev) => [...prev, data as Comment]);
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
        {comments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <svg className="w-8 h-8 text-muted-foreground/20 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-xs text-muted-foreground/50 font-medium">No notes yet</p>
            <p className="text-[10px] text-muted-foreground/30 mt-1.5 max-w-[180px] leading-relaxed">
              Click anywhere on the waveform to add a timestamped comment
            </p>
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

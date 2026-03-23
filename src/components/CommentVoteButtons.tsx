import { useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabaseClient";


type VoteDir = 1 | -1 | null;

interface Props {
  commentId: string;
  userId: string | undefined;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: VoteDir;
}

const CommentVoteButtons = ({
  commentId,
  userId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
}: Props) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<VoteDir>(initialUserVote);
  const [busy, setBusy] = useState(false);

  const handleVote = useCallback(
    async (dir: 1 | -1) => {
      if (!userId || busy) return;

      const prevVote = userVote;
      const prevUp = upvotes;
      const prevDown = downvotes;

      // Determine new vote state
      const newVote: VoteDir = prevVote === dir ? null : dir;

      // Optimistic update
      let nextUp = prevUp;
      let nextDown = prevDown;
      if (prevVote === 1) nextUp--;
      if (prevVote === -1) nextDown--;
      if (newVote === 1) nextUp++;
      if (newVote === -1) nextDown++;
      setUserVote(newVote);
      setUpvotes(nextUp);
      setDownvotes(nextDown);

      setBusy(true);
      try {
        if (newVote === null) {
          // Remove vote
          await supabase
            .from("comment_votes" as any)
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", userId);
        } else if (prevVote === null) {
          // Insert new vote
          await supabase
            .from("comment_votes" as any)
            .insert({ comment_id: commentId, user_id: userId, vote: newVote } as any);
        } else {
          // Update existing vote
          await supabase
            .from("comment_votes" as any)
            .update({ vote: newVote } as any)
            .eq("comment_id", commentId)
            .eq("user_id", userId);
        }
      } catch {
        // Rollback on error
        setUserVote(prevVote);
        setUpvotes(prevUp);
        setDownvotes(prevDown);
      } finally {
        setBusy(false);
      }
    },
    [commentId, userId, userVote, upvotes, downvotes, busy]
  );

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); handleVote(1); }}
            disabled={!userId || busy}
            aria-label="Mark comment as helpful"
            className="flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              border: userVote === 1 ? "1px solid #111" : "1px solid #e8e8e8",
              backgroundColor: userVote === 1 ? "#111" : "#ffffff",
              color: userVote === 1 ? "#ffffff" : "#999",
            }}
            onMouseEnter={(e) => { if (userVote !== 1) { e.currentTarget.style.backgroundColor = "#f5f5f3"; e.currentTarget.style.borderColor = "#ccc"; } }}
            onMouseLeave={(e) => { if (userVote !== 1) { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#e8e8e8"; } }}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Helpful</TooltipContent>
      </Tooltip>

      <span
        className="text-[10px] tabular-nums min-w-[14px] text-center"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          color: upvotes - downvotes > 0 ? "#111" : upvotes - downvotes < 0 ? "#c44" : "#bbb",
        }}
      >
        {upvotes - downvotes !== 0 ? (upvotes - downvotes > 0 ? `+${upvotes - downvotes}` : upvotes - downvotes) : "0"}
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); handleVote(-1); }}
            disabled={!userId || busy}
            aria-label="Mark comment as not helpful"
            className="flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              border: userVote === -1 ? "1px solid #111" : "1px solid #e8e8e8",
              backgroundColor: userVote === -1 ? "#111" : "#ffffff",
              color: userVote === -1 ? "#ffffff" : "#999",
            }}
            onMouseEnter={(e) => { if (userVote !== -1) { e.currentTarget.style.backgroundColor = "#f5f5f3"; e.currentTarget.style.borderColor = "#ccc"; } }}
            onMouseLeave={(e) => { if (userVote !== -1) { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#e8e8e8"; } }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Not Helpful</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default CommentVoteButtons;

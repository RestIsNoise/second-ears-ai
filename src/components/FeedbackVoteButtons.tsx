import { useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type VoteDir = 1 | -1 | null;

interface Props {
  feedbackItemId: string;
  analysisId: string;
  userId: string | undefined;
  initialUserVote: VoteDir;
}

const FeedbackVoteButtons = ({
  feedbackItemId,
  analysisId,
  userId,
  initialUserVote,
}: Props) => {
  const [userVote, setUserVote] = useState<VoteDir>(initialUserVote);
  const [busy, setBusy] = useState(false);

  const handleVote = useCallback(
    async (dir: 1 | -1) => {
      if (!userId || busy) return;

      const prevVote = userVote;
      const newVote: VoteDir = prevVote === dir ? null : dir;

      setUserVote(newVote);
      setBusy(true);

      try {
        if (newVote === null) {
          await supabase
            .from("feedback_votes" as any)
            .delete()
            .eq("feedback_item_id", feedbackItemId)
            .eq("user_id", userId);
        } else if (prevVote === null) {
          await supabase
            .from("feedback_votes" as any)
            .insert({
              feedback_item_id: feedbackItemId,
              analysis_id: analysisId,
              user_id: userId,
              vote: newVote,
            } as any);
        } else {
          await supabase
            .from("feedback_votes" as any)
            .update({ vote: newVote } as any)
            .eq("feedback_item_id", feedbackItemId)
            .eq("user_id", userId);
        }
      } catch {
        setUserVote(prevVote);
      } finally {
        setBusy(false);
      }
    },
    [feedbackItemId, analysisId, userId, userVote, busy]
  );

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); handleVote(1); }}
            disabled={!userId || busy}
            aria-label="Mark feedback as helpful"
            className={cn(
              "p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              userVote === 1
                ? "text-primary bg-primary/10"
                : "text-muted-foreground/40 hover:text-primary/70 hover:bg-primary/5"
            )}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Helpful</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); handleVote(-1); }}
            disabled={!userId || busy}
            aria-label="Mark feedback as not helpful"
            className={cn(
              "p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              userVote === -1
                ? "text-destructive bg-destructive/10"
                : "text-muted-foreground/40 hover:text-destructive/70 hover:bg-destructive/5"
            )}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Not Helpful</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default FeedbackVoteButtons;

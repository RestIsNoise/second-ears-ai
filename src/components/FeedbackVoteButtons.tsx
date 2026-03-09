import { useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type VoteDir = 1 | -1 | null;

interface Props {
  analysisId: string;
  priorityIndex: number;
  userId: string | undefined;
  initialUserVote: VoteDir;
}

const BACKEND_URL = "https://secondears-backend-production.up.railway.app/api/feedback-vote";

const FeedbackVoteButtons = ({
  analysisId,
  priorityIndex,
  userId,
  initialUserVote,
}: Props) => {
  const [userVote, setUserVote] = useState<VoteDir>(initialUserVote);

  const handleVote = useCallback(
    (dir: 1 | -1) => {
      if (!userId) return;

      const newVote: VoteDir = userVote === dir ? null : dir;
      setUserVote(newVote);

      // Fire and forget
      fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "secondears-secret-2024",
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          priority_index: priorityIndex,
          user_id: userId,
          vote: newVote === 1 ? "up" : newVote === -1 ? "down" : null,
        }),
      }).catch(() => {/* silent */});
    },
    [analysisId, priorityIndex, userId, userVote]
  );

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); handleVote(1); }}
            disabled={!userId}
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
            disabled={!userId}
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

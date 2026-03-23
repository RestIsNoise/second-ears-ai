import { useState, useCallback, useMemo } from "react";
import { Plus, Minus } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { getAuthHeaders, BACKEND } from "@/lib/backendFetch";

type VoteDir = 1 | -1 | null;

interface Props {
  analysisId: string;
  priorityIndex: number;
  userId: string | undefined;
  initialUserVote: VoteDir;
}

const MONO = "'IBM Plex Mono', monospace";

const FeedbackVoteButtons = ({
  analysisId,
  priorityIndex,
  userId,
  initialUserVote,
}: Props) => {
  const [userVote, setUserVote] = useState<VoteDir>(initialUserVote);
  const isDark = useMemo(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark",
    []
  );

  const handleVote = useCallback(
    (dir: 1 | -1) => {
      if (!userId) return;
      const newVote: VoteDir = userVote === dir ? null : dir;
      setUserVote(newVote);

      getAuthHeaders().then((authHeaders) => {
        fetch(`${BACKEND}/api/feedback-vote`, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis_id: analysisId,
            priority_index: priorityIndex,
            user_id: userId,
            vote: newVote === 1 ? "up" : newVote === -1 ? "down" : null,
          }),
        }).catch(() => {});
      }).catch(() => {});
    },
    [analysisId, priorityIndex, userId, userVote]
  );

  const baseCircle: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: userId ? "pointer" : "default",
    transition: "all 0.15s ease",
    padding: 0,
    background: "transparent",
  };

  const upActive = userVote === 1;
  const downActive = userVote === -1;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); handleVote(1); }}
            disabled={!userId}
            aria-label="This helped"
            style={{
              ...baseCircle,
              border: upActive ? "1px solid #22c55e" : `1px solid ${isDark ? "#333" : "#d0d0d0"}`,
              backgroundColor: upActive ? "#22c55e" : "transparent",
              color: upActive ? "white" : isDark ? "#555" : "#666",
            }}
            onMouseEnter={(e) => {
              if (!upActive) {
                e.currentTarget.style.borderColor = "#22c55e";
                e.currentTarget.style.color = "#22c55e";
              }
            }}
            onMouseLeave={(e) => {
              if (!upActive) {
                e.currentTarget.style.borderColor = isDark ? "#333" : "#d0d0d0";
                e.currentTarget.style.color = isDark ? "#555" : "#666";
              }
            }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          style={{ fontSize: 11, background: "#111", color: "white", padding: "4px 8px", borderRadius: 4, border: "none" }}
        >
          This helped
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); handleVote(-1); }}
            disabled={!userId}
            aria-label="Not helpful"
            style={{
              ...baseCircle,
              border: downActive ? "1px solid #ef4444" : `1px solid ${isDark ? "#333" : "#d0d0d0"}`,
              backgroundColor: downActive ? "#ef4444" : "transparent",
              color: downActive ? "white" : isDark ? "#555" : "#666",
            }}
            onMouseEnter={(e) => {
              if (!downActive) {
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.color = "#ef4444";
              }
            }}
            onMouseLeave={(e) => {
              if (!downActive) {
                e.currentTarget.style.borderColor = isDark ? "#333" : "#d0d0d0";
                e.currentTarget.style.color = isDark ? "#555" : "#666";
              }
            }}
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          style={{ fontSize: 11, background: "#111", color: "white", padding: "4px 8px", borderRadius: 4, border: "none" }}
        >
          Not helpful
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default FeedbackVoteButtons;

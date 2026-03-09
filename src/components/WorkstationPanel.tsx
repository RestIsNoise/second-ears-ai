import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Flex weight per panel id */
const PANEL_FLEX: Record<string, number> = {
  "ai-reference": 2,
  "ai-feedback": 2.5,
  "full-analysis": 2,
  "session": 2,
  "tech-metrics": 1.5,
  "human-feedback": 1.5,
  "todo": 1.2,
};

interface Props {
  id: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const WorkstationPanel = ({ id, title, onClose, children }: Props) => {
  const flex = PANEL_FLEX[id] ?? 1;
  const minWidth = id === "ai-feedback" ? 340 : id === "session" ? 300 : id === "todo" ? 240 : 200;

  return (
    <div
      className="flex flex-col h-full min-w-0 border-r border-border/70 last:border-r-0"
      style={{ flex, minWidth }}
    >
      {/* Header — tinted surface for clear layer separation */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 shrink-0"
        style={{ backgroundColor: "hsl(var(--panel-header))" }}
      >
        <h3
          className="text-[10px] text-foreground/50 tracking-[0.08em] uppercase truncate select-none font-semibold"
          style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
        >
          {title}
        </h3>
        <button
          onClick={onClose}
          className="text-foreground/25 hover:text-foreground/60 transition-colors shrink-0 ml-2 rounded p-0.5 hover:bg-secondary/40"
          title="Close panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto min-h-0 scrollbar-thin"
        style={{ backgroundColor: "hsl(var(--panel-content))" }}
      >
        {children}
      </div>
    </div>
  );
};

export default WorkstationPanel;

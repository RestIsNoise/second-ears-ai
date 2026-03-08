import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Flex weight per panel id */
const PANEL_FLEX: Record<string, number> = {
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
      className="flex flex-col h-full min-w-0 border-r border-border-subtle/60 last:border-r-0"
      style={{ flex, minWidth }}
    >
      {/* Header — elevated surface with subtle depth */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle/60 shrink-0 bg-secondary/20">
        <h3
          className="text-[10px] text-muted-foreground/60 tracking-[0.1em] uppercase truncate select-none"
          style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
        >
          {title}
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground/30 hover:text-foreground/60 transition-colors shrink-0 ml-2 rounded p-0.5 hover:bg-secondary/40"
          title="Close panel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      {/* Scrollable content — slight inset feel */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin bg-background/50">
        {children}
      </div>
    </div>
  );
};

export default WorkstationPanel;

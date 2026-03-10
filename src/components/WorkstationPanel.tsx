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
      className="flex flex-col h-full min-w-0 border-r border-foreground/[0.08] last:border-r-0"
      style={{ flex, minWidth }}
    >
      {/* Header — industrial panel chrome */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{
          backgroundColor: "hsl(var(--panel-header))",
          borderBottom: "1px solid hsl(var(--foreground) / 0.1)",
          boxShadow: "inset 0 -1px 0 hsl(var(--panel-inset)), inset 0 1px 0 hsl(0 0% 100% / 0.04)",
        }}
      >
        <div className="flex items-center gap-2">
          {/* Status indicator dot */}
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "hsl(var(--foreground) / 0.25)" }}
          />
          <h3
            className="text-[10px] text-foreground/70 tracking-[0.1em] uppercase truncate select-none font-bold"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            {title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-foreground/20 hover:text-foreground/60 transition-colors shrink-0 ml-2 rounded p-0.5 hover:bg-foreground/[0.06]"
          title="Close panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Scrollable content — recessed surface */}
      <div
        className="flex-1 overflow-y-auto min-h-0 scrollbar-thin relative"
        style={{
          backgroundColor: "hsl(var(--panel-content))",
          boxShadow: "inset 0 2px 4px hsl(var(--panel-inset))",
        }}
      >
        {/* Subtle noise grain texture for panel content */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "256px 256px",
          }}
        />
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
};

export default WorkstationPanel;

import {
  AudioWaveform, BarChart3, ListChecks, MessageSquare,
  FileText, Layers, Radio, LayoutPanelTop,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PanelConfig {
  id: string;
  label: string;
}

interface Props {
  panels: PanelConfig[];
  activePanels: Set<string>;
  onToggle: (id: string) => void;
  maxPanels?: number;
  footer?: React.ReactNode;
}

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

/* Panel-specific icons for a workstation feel */
const panelIcons: Record<string, React.ElementType> = {
  "ai-reference": AudioWaveform,
  "ai-feedback": Radio,
  "human-feedback": MessageSquare,
  "tech-metrics": BarChart3,
  "full-analysis": FileText,
  "session": Layers,
  "todo": ListChecks,
};

/* Ordered panel IDs */
const PANEL_ORDER = ["ai-feedback", "ai-reference", "full-analysis", "tech-metrics", "session", "human-feedback", "todo"];

const PanelSidebar = ({ panels, activePanels, onToggle, maxPanels = 4, footer }: Props) => {
  const atMax = activePanels.size >= maxPanels;
  const panelMap = new Map(panels.map(p => [p.id, p]));

  return (
    <div
      className="flex flex-col h-full w-[164px] min-w-[164px] shrink-0 overflow-visible select-none"
      style={{
        backgroundColor: "hsl(var(--workspace-bg))",
        borderRight: "3px solid hsl(var(--foreground) / 0.14)",
        boxShadow: "inset -1px 0 0 hsl(0 0% 100% / 0.03), 2px 0 6px hsl(0 0% 0% / 0.06)",
      }}
    >
      {/* ═══ HEADER ═══ */}
      <div
        style={{
          padding: "6px 10px",
          borderBottom: "2px solid hsl(var(--foreground) / 0.08)",
          backgroundColor: "hsl(var(--panel-header))",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[8px] text-foreground/40 tracking-[0.14em] uppercase font-extrabold"
            style={{ fontFamily: MONO }}
          >
            Modules
          </span>
          <span
            className="text-foreground/18 font-bold tabular-nums ml-auto"
            style={{ fontFamily: MONO, fontSize: 7 }}
          >
            {activePanels.size}/{maxPanels}
          </span>
        </div>
      </div>

      {/* ═══ PANEL SELECTOR ═══ */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: "2px 0" }}>
        {PANEL_ORDER.map((id) => {
          const panel = panelMap.get(id);
          if (!panel) return null;
          const isActive = activePanels.has(panel.id);
          const disabled = !isActive && atMax;
          const Icon = panelIcons[panel.id] || LayoutPanelTop;

          return (
            <button
              key={panel.id}
              onClick={() => !disabled && onToggle(panel.id)}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-2 text-left transition-all duration-75",
                disabled && "cursor-not-allowed opacity-40",
              )}
              style={{
                padding: "5px 8px 5px 0",
                marginLeft: 0,
                borderLeft: isActive
                  ? "3px solid hsl(var(--foreground) / 0.7)"
                  : "3px solid transparent",
                backgroundColor: isActive
                  ? "hsl(var(--foreground) / 0.04)"
                  : "transparent",
                boxShadow: isActive
                  ? "inset 0 1px 0 hsl(0 0% 100% / 0.04), inset 0 -1px 0 hsl(0 0% 0% / 0.03)"
                  : "none",
              }}
            >
              {/* Icon well */}
              <div
                className="shrink-0 flex items-center justify-center ml-[7px]"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 2,
                  backgroundColor: isActive ? "hsl(var(--foreground) / 0.08)" : "transparent",
                  boxShadow: isActive ? "inset 0 1px 2px hsl(0 0% 0% / 0.08)" : "none",
                }}
              >
                <Icon
                  className={cn(
                    "w-[10px] h-[10px]",
                    isActive ? "text-foreground/75" : "text-foreground/30",
                  )}
                  strokeWidth={isActive ? 2.4 : 1.6}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[8.5px] tracking-[0.04em] truncate uppercase",
                  isActive
                    ? "text-foreground/85 font-bold"
                    : "text-foreground/35 font-semibold",
                )}
                style={{ fontFamily: MONO, lineHeight: 1 }}
              >
                {panel.label}
              </span>

              {/* Status LED */}
              {isActive && (
                <div
                  className="w-[3.5px] h-[3.5px] rounded-full ml-auto shrink-0 mr-1"
                  style={{
                    backgroundColor: "hsl(145 55% 45%)",
                    boxShadow: "0 0 3px hsl(145 55% 45% / 0.5)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ FOOTER — CONTROLS SECTION ═══ */}
      {footer && (
        <div
          style={{
            borderTop: "2px solid hsl(var(--foreground) / 0.08)",
            backgroundColor: "hsl(var(--panel-header))",
          }}
        >
          {/* Section label */}
          <div
            className="flex items-center gap-1.5"
            style={{
              padding: "3px 10px",
              borderBottom: "1px solid hsl(var(--foreground) / 0.04)",
            }}
          >
            <div
              style={{
                width: 3,
                height: 3,
                backgroundColor: "hsl(var(--foreground) / 0.12)",
                borderRadius: 1,
              }}
            />
            <span
              className="text-foreground/22 uppercase tracking-[0.14em] font-extrabold"
              style={{ fontFamily: MONO, fontSize: 6.5 }}
            >
              Controls
            </span>
          </div>
          <div style={{ padding: "8px 10px", backgroundColor: "hsl(var(--workspace-bg))" }}>
            {footer}
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelSidebar;

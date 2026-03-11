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
      className="flex flex-col h-full w-[152px] min-w-[152px] shrink-0 overflow-visible select-none"
      style={{
        backgroundColor: "hsl(var(--workspace-bg))",
        borderRight: "3px solid hsl(var(--foreground) / 0.14)",
        boxShadow: "inset -1px 0 0 hsl(0 0% 100% / 0.03), 2px 0 6px hsl(0 0% 0% / 0.06)",
      }}
    >
      {/* ═══ RACK HEADER ═══ */}
      <div
        style={{
          padding: "6px 10px",
          borderBottom: "2px solid hsl(var(--foreground) / 0.08)",
          backgroundColor: "hsl(var(--panel-header))",
        }}
      >
        {/* Top bevel */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: 1, background: "hsl(0 0% 100% / 0.05)" }}
        />
        <div className="flex items-center gap-2">
          <div
            className="w-[7px] h-[7px] rounded-full shrink-0"
            style={{
              background: "radial-gradient(circle at 35% 35%, hsl(var(--foreground) / 0.2), hsl(var(--foreground) / 0.06))",
              boxShadow: "inset 0 0.5px 1px hsl(0 0% 100% / 0.15), 0 0 0 0.5px hsl(var(--foreground) / 0.06)",
            }}
          />
          <span
            className="text-[8px] text-foreground/45 tracking-[0.18em] uppercase font-extrabold"
            style={{ fontFamily: MONO }}
          >
            Modules
          </span>
          {/* Active count */}
          <span
            className="text-foreground/20 font-bold tabular-nums ml-auto"
            style={{ fontFamily: MONO, fontSize: 7 }}
          >
            {activePanels.size}/{maxPanels}
          </span>
        </div>
      </div>

      {/* ═══ GROUPED PANEL BUTTONS ═══ */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {GROUPS.map((group, gi) => {
          const groupPanels = group.ids.map(id => panelMap.get(id)).filter(Boolean) as PanelConfig[];
          if (groupPanels.length === 0) return null;

          return (
            <div key={group.label}>
              {/* Group label — section divider */}
              <div
                className="flex items-center gap-1.5 px-2.5"
                style={{
                  padding: "4px 10px",
                  backgroundColor: gi > 0 ? "hsl(var(--panel-header))" : "transparent",
                  borderTop: gi > 0 ? "1px solid hsl(var(--foreground) / 0.06)" : "none",
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
                  {group.label}
                </span>
              </div>

              {/* Panel items */}
              {groupPanels.map((panel) => {
                const isActive = activePanels.has(panel.id);
                const disabled = !isActive && atMax;
                const Icon = panelIcons[panel.id] || LayoutPanelTop;

                return (
                  <button
                    key={panel.id}
                    onClick={() => !disabled && onToggle(panel.id)}
                    disabled={disabled}
                    className={cn(
                      "w-full flex items-center gap-2.5 text-left transition-all duration-100",
                      disabled && "cursor-not-allowed",
                    )}
                    style={{
                      padding: "6px 10px",
                      borderLeft: isActive
                        ? "3px solid hsl(var(--foreground) / 0.6)"
                        : "3px solid transparent",
                      backgroundColor: isActive
                        ? "hsl(var(--panel-content))"
                        : "transparent",
                      boxShadow: isActive
                        ? "inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -1px 0 hsl(0 0% 0% / 0.04)"
                        : "none",
                      borderBottom: "1px solid hsl(var(--foreground) / 0.03)",
                    }}
                  >
                    {/* Icon — recessed well for active, flat for inactive */}
                    <div
                      className="shrink-0 flex items-center justify-center"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 2,
                        backgroundColor: isActive
                          ? "hsl(var(--foreground) / 0.06)"
                          : "transparent",
                        border: isActive
                          ? "1px solid hsl(var(--foreground) / 0.06)"
                          : "1px solid transparent",
                        boxShadow: isActive
                          ? "inset 0 1px 2px hsl(0 0% 0% / 0.06)"
                          : "none",
                      }}
                    >
                      <Icon
                        className={cn(
                          "w-[11px] h-[11px]",
                          isActive ? "text-foreground/65" : disabled ? "text-foreground/12" : "text-foreground/25",
                        )}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        "text-[9px] tracking-[0.02em] truncate",
                        isActive
                          ? "text-foreground/80 font-bold"
                          : disabled
                            ? "text-foreground/15 font-medium"
                            : "text-foreground/45 font-medium hover:text-foreground/65",
                      )}
                      style={{ fontFamily: MONO }}
                    >
                      {panel.label}
                    </span>

                    {/* Active LED */}
                    {isActive && (
                      <div
                        className="w-[4px] h-[4px] rounded-full ml-auto shrink-0"
                        style={{
                          backgroundColor: "hsl(145 60% 42%)",
                          boxShadow: "0 0 4px hsl(145 60% 42% / 0.4)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
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

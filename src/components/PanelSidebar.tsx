import {
  AudioWaveform, BarChart3, ListChecks, MessageSquare,
  FileText, Layers, Radio, LayoutPanelTop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const moduleTooltips: Record<string, string> = {
  "ai-feedback": "AI diagnostics anchored to your track. Each note identifies a specific problem and how to fix it.",
  "tech-metrics": "Objective measurements of your mix: loudness, dynamics, stereo image and frequency balance.",
  "ai-reference": "Compare your track against a reference. Upload a professional track and analyze the differences.",
  "human-feedback": "Leave timestamped comments. Click anywhere on the waveform to anchor a note to that moment.",
  "todo": "Task list generated from the analysis. Check items off as you work through the mix.",
  "full-analysis": "Extended analysis: mix balance, arrangement, tonal read and full context of the track.",
};

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

const panelIcons: Record<string, React.ElementType> = {
  "ai-reference": AudioWaveform,
  "ai-feedback": Radio,
  "human-feedback": MessageSquare,
  "tech-metrics": BarChart3,
  "full-analysis": FileText,
  "session": Layers,
  "todo": ListChecks,
};

const PANEL_ORDER = ["ai-feedback", "ai-reference", "full-analysis", "tech-metrics", "human-feedback", "todo"];

const PanelSidebar = ({ panels, activePanels, onToggle, maxPanels = 4, footer }: Props) => {
  const atMax = activePanels.size >= maxPanels;
  const panelMap = new Map(panels.map(p => [p.id, p]));

  return (
    <TooltipProvider>
    <div
      className="flex flex-col h-full w-[184px] min-w-[184px] shrink-0 overflow-visible select-none"
      style={{
        backgroundColor: "hsl(var(--workspace-bg))",
        borderRight: "3px solid hsl(var(--foreground) / 0.14)",
        boxShadow: "inset -1px 0 0 hsl(0 0% 100% / 0.03), 2px 0 6px hsl(0 0% 0% / 0.06)",
      }}
    >
      {/* ═══ HEADER ═══ */}
      <div
        style={{
          padding: "12px 12px 8px",
          borderBottom: "1px solid hsl(0 0% 91%)",
          marginBottom: 4,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="uppercase"
            style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.15em", color: "hsl(0 0% 73%)" }}
          >
            Modules
          </span>
          <span
            className="tabular-nums ml-auto"
            style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.15em", color: "hsl(0 0% 73%)" }}
          >
            {activePanels.size}/{maxPanels}
          </span>
        </div>
      </div>

      {/* ═══ PANEL SELECTOR ═══ */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {PANEL_ORDER.map((id) => {
          const panel = panelMap.get(id);
          if (!panel) return null;
          const isActive = activePanels.has(panel.id);
          const disabled = !isActive && atMax;

          return (
            <Tooltip key={panel.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !disabled && onToggle(panel.id)}
                  disabled={disabled}
                  className={cn(
                    "w-full flex items-center gap-2.5 text-left transition-colors duration-75",
                    disabled && "cursor-not-allowed opacity-40",
                    !isActive && !disabled && "hover:bg-[hsl(40_10%_96%)] hover:text-[hsl(0_0%_7%)]",
                  )}
                  style={{
                    padding: "10px 12px",
                    borderLeft: isActive ? "3px solid hsl(0 0% 7%)" : "3px solid transparent",
                    backgroundColor: isActive ? "hsl(0 0% 7%)" : "transparent",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {/* Label */}
                  <span
                    className="uppercase truncate"
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      color: isActive ? "hsl(0 0% 100%)" : "hsl(0 0% 40%)",
                      fontWeight: isActive ? 600 : 500,
                      lineHeight: 1.1,
                    }}
                  >
                    {panel.label}
                  </span>

                  {/* Status dot */}
                  <div
                    className="shrink-0 ml-auto"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: isActive ? "hsl(145 55% 45%)" : "hsl(0 0% 82%)",
                      boxShadow: isActive ? "0 0 4px hsl(145 55% 45% / 0.5)" : "none",
                    }}
                  />
                </button>
              </TooltipTrigger>
              {moduleTooltips[panel.id] && (
                <TooltipContent
                  side="right"
                  className="max-w-[200px] text-xs"
                  style={{ backgroundColor: "hsl(0 0% 10%)", color: "hsl(0 0% 96%)", border: "1px solid hsl(0 0% 20%)" }}
                >
                  {moduleTooltips[panel.id]}
                </TooltipContent>
              )}
            </Tooltip>
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
          <div
            className="flex items-center gap-2"
            style={{
              padding: "12px 12px 8px",
              borderBottom: "1px solid hsl(0 0% 91%)",
            }}
          >
            <span
              className="uppercase"
              style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.15em", color: "hsl(0 0% 73%)" }}
            >
              Controls
            </span>
          </div>
          <div style={{ padding: "10px 12px", backgroundColor: "hsl(var(--workspace-bg))" }}>
            {footer}
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};

export default PanelSidebar;

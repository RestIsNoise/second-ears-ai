import { LayoutPanelTop } from "lucide-react";
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

const PanelSidebar = ({ panels, activePanels, onToggle, maxPanels = 4, footer }: Props) => {
  const atMax = activePanels.size >= maxPanels;

  return (
    <div
      className="flex flex-col h-full w-[148px] min-w-[148px] shrink-0 border-r border-border/60 overflow-visible"
      style={{ backgroundColor: "hsl(var(--panel-header))" }}
    >
      {/* Section label */}
      <div className="px-3 pt-3 pb-1.5">
        <span
          className="text-[9px] text-foreground/55 tracking-[0.1em] uppercase select-none font-medium"
          style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
        >
          Panels
        </span>
      </div>

      <div className="flex-1 py-0.5">
        {panels.map((panel) => {
          const isActive = activePanels.has(panel.id);
          const disabled = !isActive && atMax;

          return (
            <button
              key={panel.id}
              onClick={() => !disabled && onToggle(panel.id)}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-[8px] text-left transition-all duration-150 border-l-[3px]",
                isActive
                  ? "border-l-foreground/70 text-foreground"
                  : disabled
                    ? "border-l-transparent text-foreground/25 cursor-not-allowed"
                    : "border-l-transparent text-foreground/55 hover:text-foreground/75 hover:bg-foreground/[0.04]"
              )}
              style={{
                backgroundColor: isActive ? "hsl(var(--panel-content))" : "transparent",
              }}
            >
              <LayoutPanelTop className={cn("w-[18px] h-[18px] shrink-0", isActive ? "opacity-80" : "opacity-45")} />
              <span
                className={cn(
                  "text-[11px] tracking-tight truncate",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {panel.label}
              </span>
            </button>
          );
        })}
      </div>

      {footer && (
        <div className="border-t border-border/50 p-3" style={{ backgroundColor: "hsl(var(--panel-header))" }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default PanelSidebar;

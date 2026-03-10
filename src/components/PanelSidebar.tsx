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
      className="flex flex-col h-full w-[148px] min-w-[148px] shrink-0 overflow-visible"
      style={{
        backgroundColor: "hsl(var(--workspace-bg))",
        borderRight: "1px solid hsl(var(--foreground) / 0.1)",
        boxShadow: "inset -1px 0 0 hsl(0 0% 100% / 0.03)",
      }}
    >
      {/* Section label */}
      <div
        className="px-3 pt-3 pb-1.5"
        style={{ borderBottom: "1px solid hsl(var(--foreground) / 0.06)" }}
      >
        <span
          className="text-[9px] text-foreground/50 tracking-[0.12em] uppercase select-none font-bold"
          style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
        >
          Modules
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
                  ? "border-l-foreground/80 text-foreground"
                  : disabled
                    ? "border-l-transparent text-foreground/20 cursor-not-allowed"
                    : "border-l-transparent text-foreground/50 hover:text-foreground/75 hover:bg-foreground/[0.05]"
              )}
              style={{
                backgroundColor: isActive ? "hsl(var(--panel-content))" : "transparent",
                boxShadow: isActive ? "inset 0 1px 0 hsl(0 0% 100% / 0.04), inset 0 -1px 0 hsl(var(--panel-inset))" : "none",
              }}
            >
              <LayoutPanelTop className={cn("w-[18px] h-[18px] shrink-0", isActive ? "opacity-85" : "opacity-35")} />
              <span
                className={cn(
                  "text-[11px] tracking-tight truncate",
                  isActive ? "font-bold" : "font-medium"
                )}
              >
                {panel.label}
              </span>
            </button>
          );
        })}
      </div>

      {footer && (
        <div
          className="p-3"
          style={{
            backgroundColor: "hsl(var(--workspace-bg))",
            borderTop: "1px solid hsl(var(--foreground) / 0.08)",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default PanelSidebar;

import { PanelLeft } from "lucide-react";
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
    <div className="flex flex-col h-full w-[148px] min-w-[148px] shrink-0 border-r border-border-subtle/60 bg-secondary/15 overflow-visible">
      {/* Section label */}
      <div className="px-3 pt-3 pb-1.5">
        <span
          className="text-[8px] text-muted-foreground/35 tracking-[0.14em] uppercase select-none"
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
                "w-full flex items-center gap-2 px-3 py-[7px] text-left transition-all duration-150",
                isActive
                  ? "bg-secondary/60 text-foreground/80 border-l-2 border-l-foreground/15"
                  : disabled
                    ? "text-muted-foreground/20 cursor-not-allowed border-l-2 border-l-transparent"
                    : "text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/30 border-l-2 border-l-transparent"
              )}
            >
              <PanelLeft className={cn("w-3 h-3 shrink-0", isActive ? "opacity-60" : "opacity-40")} />
              <span className="text-[10px] font-medium tracking-tight truncate">
                {panel.label}
              </span>
            </button>
          );
        })}
      </div>

      {footer && (
        <div className="border-t border-border-subtle/40 p-3 bg-secondary/10">
          {footer}
        </div>
      )}
    </div>
  );
};

export default PanelSidebar;

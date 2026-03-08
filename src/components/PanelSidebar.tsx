import { Eye, EyeOff } from "lucide-react";

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
    <div className="flex flex-col h-full w-[140px] min-w-[140px] shrink-0 border-r border-border-subtle bg-background overflow-visible">
      <div className="flex-1 py-3">
        {panels.map((panel) => {
          const isActive = activePanels.has(panel.id);
          const disabled = !isActive && atMax;

          return (
            <button
              key={panel.id}
              onClick={() => !disabled && onToggle(panel.id)}
              disabled={disabled}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                isActive
                  ? "bg-secondary/50 text-foreground"
                  : disabled
                    ? "text-muted-foreground/25 cursor-not-allowed"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/20"
              }`}
            >
              {isActive ? (
                <Eye className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="text-[10px] font-medium tracking-tight truncate">
                {panel.label}
              </span>
            </button>
          );
        })}
      </div>
      {footer && (
        <div className="border-t border-border-subtle p-3">
          {footer}
        </div>
      )}
    </div>
  );
};

export default PanelSidebar;

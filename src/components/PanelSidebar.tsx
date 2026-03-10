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

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const PanelSidebar = ({ panels, activePanels, onToggle, maxPanels = 4, footer }: Props) => {
  const atMax = activePanels.size >= maxPanels;

  return (
    <div
      className="flex flex-col h-full w-[148px] min-w-[148px] shrink-0 overflow-visible"
      style={{
        backgroundColor: "hsl(var(--workspace-bg))",
        borderRight: "1px solid hsl(var(--foreground) / 0.12)",
        boxShadow: "inset -1px 0 0 hsl(0 0% 100% / 0.03)",
      }}
    >
      {/* Rack label — like a hardware module section */}
      <div
        className="px-3 pt-3 pb-2"
        style={{
          borderBottom: "1px solid hsl(var(--foreground) / 0.08)",
          boxShadow: "inset 0 -1px 0 hsl(0 0% 100% / 0.03)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: "hsl(var(--foreground) / 0.2)" }}
          />
          <span
            className="text-[8px] text-foreground/40 tracking-[0.18em] uppercase select-none font-bold"
            style={{ fontFamily: MONO }}
          >
            Modules
          </span>
        </div>
      </div>

      <div className="flex-1 py-1">
        {panels.map((panel, i) => {
          const isActive = activePanels.has(panel.id);
          const disabled = !isActive && atMax;

          return (
            <div key={panel.id}>
              <button
                onClick={() => !disabled && onToggle(panel.id)}
                disabled={disabled}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-[7px] text-left transition-all duration-100 border-l-[3px]",
                  isActive
                    ? "border-l-foreground/70 text-foreground"
                    : disabled
                      ? "border-l-transparent text-foreground/15 cursor-not-allowed"
                      : "border-l-transparent text-foreground/45 hover:text-foreground/70 hover:bg-foreground/[0.04]"
                )}
                style={{
                  backgroundColor: isActive ? "hsl(var(--panel-content))" : "transparent",
                  boxShadow: isActive
                    ? "inset 0 1px 0 hsl(0 0% 100% / 0.05), inset 0 -1px 0 hsl(var(--panel-inset))"
                    : "none",
                }}
              >
                <LayoutPanelTop
                  className={cn("w-[14px] h-[14px] shrink-0", isActive ? "opacity-75" : "opacity-25")}
                />
                <span
                  className={cn(
                    "text-[10px] tracking-[0.02em] truncate",
                    isActive ? "font-bold" : "font-medium"
                  )}
                  style={{ fontFamily: MONO }}
                >
                  {panel.label}
                </span>
              </button>
              {/* Channel divider between items */}
              {i < panels.length - 1 && (
                <div
                  className="mx-3"
                  style={{ height: 1, backgroundColor: "hsl(var(--foreground) / 0.04)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {footer && (
        <div
          className="p-3"
          style={{
            backgroundColor: "hsl(var(--workspace-bg))",
            borderTop: "1px solid hsl(var(--foreground) / 0.1)",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.03)",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default PanelSidebar;

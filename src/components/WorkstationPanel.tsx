import { X } from "lucide-react";

/** Width tuning per panel id */
const PANEL_SIZING: Record<string, { flex: number; minWidth: number }> = {
  "ai-reference": { flex: 2, minWidth: 240 },
  "ai-feedback": { flex: 2.15, minWidth: 320 },
  "full-analysis": { flex: 2, minWidth: 240 },
  "session": { flex: 2, minWidth: 320 },
  "tech-metrics": { flex: 1.2, minWidth: 210 },
  "human-feedback": { flex: 1.5, minWidth: 240 },
  "todo": { flex: 1, minWidth: 220 },
};

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

interface Props {
  id: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

const WorkstationPanel = ({ id, title, onClose, children, headerExtra }: Props) => {
  const panelSizing = PANEL_SIZING[id] ?? { flex: 1, minWidth: 220 };

  return (
    <div
      className="flex flex-col h-full min-w-0"
      style={{
        flex: `${panelSizing.flex} 1 0`,
        minWidth: panelSizing.minWidth,
        /* Hard channel-strip divider between panels */
        borderRight: "3px solid hsl(var(--foreground) / 0.14)",
        boxShadow: "inset -1px 0 0 hsl(0 0% 100% / 0.03), inset 1px 0 0 hsl(0 0% 0% / 0.04)",
      }}
    >
      {/* ═══ RACK-MOUNT HEADER ═══ */}
      <div
        className="shrink-0 select-none"
        style={{
          backgroundColor: "var(--wp-header-bg, hsl(var(--panel-header)))",
          borderBottom: "3px solid hsl(var(--foreground) / 0.14)",
          boxShadow: "0 2px 4px hsl(0 0% 0% / 0.06)",
          borderLeft: "var(--wp-header-accent)",
        }}
      >
        {/* Top machined edge — 2-line bevel */}
        <div style={{ height: 1, background: "hsl(0 0% 100% / 0.06)" }} />
        <div style={{ height: 1, background: "hsl(0 0% 0% / 0.12)" }} />

        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className="text-[10px] text-foreground/75 tracking-[0.18em] uppercase truncate font-semibold"
              style={{ fontFamily: MONO }}
            >
              {title}
            </h3>
            {headerExtra}
          </div>

          <button
            onClick={onClose}
            className="shrink-0 ml-2 flex items-center justify-center transition-all duration-150"
            title="Close panel"
            style={{
              width: 20,
              height: 20,
              borderRadius: 3,
              color: "hsl(var(--foreground) / 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.color = "hsl(var(--foreground) / 0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "hsl(var(--foreground) / 0.25)";
            }}
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>

        {/* Bottom machined edge — double bevel */}
        <div style={{ height: 1, background: "hsl(0 0% 0% / 0.1)" }} />
        <div style={{ height: 1, background: "hsl(0 0% 100% / 0.03)" }} />
      </div>

      {/* ═══ RECESSED CONTENT WELL ═══ */}
      <div
        className="flex-1 overflow-y-auto min-h-0 scrollbar-thin relative"
        style={{
          backgroundColor: "hsl(var(--panel-content))",
          boxShadow: "inset 0 5px 12px hsl(var(--panel-inset)), inset 1px 0 0 hsl(0 0% 0% / 0.05), inset -1px 0 0 hsl(0 0% 0% / 0.05)",
        }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "256px 256px",
          }}
        />
        {/* Fine grid overlay for technical feel */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          aria-hidden="true"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground) / 0.15) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground) / 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
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

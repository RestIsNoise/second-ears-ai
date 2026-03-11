import { X } from "lucide-react";

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

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

interface Props {
  id: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const WorkstationPanel = ({ id, title, onClose, children }: Props) => {
  const flex = PANEL_FLEX[id] ?? 1;
  const minWidth = id === "ai-feedback" ? 380 : id === "session" ? 320 : id === "todo" ? 260 : 240;

  return (
    <div
      className="flex flex-col h-full min-w-0"
      style={{
        flex,
        minWidth,
        /* Hard channel-strip divider between panels */
        borderRight: "3px solid hsl(var(--foreground) / 0.14)",
        boxShadow: "inset -1px 0 0 hsl(0 0% 100% / 0.03), inset 1px 0 0 hsl(0 0% 0% / 0.04)",
      }}
    >
      {/* ═══ RACK-MOUNT HEADER ═══ */}
      <div
        className="shrink-0 select-none"
        style={{
          backgroundColor: "hsl(var(--panel-header))",
          borderBottom: "3px solid hsl(var(--foreground) / 0.14)",
          boxShadow: "0 2px 4px hsl(0 0% 0% / 0.06)",
        }}
      >
        {/* Top machined edge — 2-line bevel */}
        <div style={{ height: 1, background: "hsl(0 0% 100% / 0.06)" }} />
        <div style={{ height: 1, background: "hsl(0 0% 0% / 0.12)" }} />

        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className="text-[15px] text-foreground/75 tracking-[0.08em] uppercase truncate font-medium"
              style={{ fontFamily: MONO }}
            >
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-foreground/25 hover:text-foreground/55 transition-colors rounded-[2px] p-2 hover:bg-foreground/[0.06] shrink-0 ml-2"
            title="Close panel"
          >
            <X className="w-4 h-4" strokeWidth={2} />
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

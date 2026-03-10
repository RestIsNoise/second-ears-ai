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
  const minWidth = id === "ai-feedback" ? 340 : id === "session" ? 300 : id === "todo" ? 240 : 200;

  return (
    <div
      className="flex flex-col h-full min-w-0"
      style={{
        flex,
        minWidth,
        borderRight: "1px solid hsl(var(--channel-divider))",
      }}
    >
      {/* ── Rack-mount header ── */}
      <div
        className="shrink-0 select-none"
        style={{
          backgroundColor: "hsl(var(--panel-header))",
          borderBottom: "1px solid hsl(var(--foreground) / 0.12)",
          boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -1px 0 hsl(0 0% 0% / 0.08)",
        }}
      >
        {/* Top bevel line — rack edge detail */}
        <div style={{ height: 1, background: "linear-gradient(90deg, hsl(var(--rack-screw)), hsl(var(--panel-header)))" }} />

        <div className="flex items-center justify-between px-3 py-[7px]">
          <div className="flex items-center gap-2 min-w-0">
            {/* Rack screw detail */}
            <div
              className="w-[7px] h-[7px] rounded-full shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(var(--foreground) / 0.15), hsl(var(--foreground) / 0.06))",
                boxShadow: "inset 0 1px 1px hsl(0 0% 100% / 0.1), 0 1px 1px hsl(0 0% 0% / 0.1)",
              }}
            />
            <h3
              className="text-[9px] text-foreground/65 tracking-[0.14em] uppercase truncate font-bold"
              style={{ fontFamily: MONO }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/18 hover:text-foreground/55 transition-colors shrink-0 ml-2 rounded-sm p-0.5 hover:bg-foreground/[0.06]"
            title="Close panel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Bottom bevel — machined edge */}
        <div style={{ height: 1, background: "linear-gradient(90deg, hsl(0 0% 0% / 0.06), hsl(0 0% 0% / 0.03))" }} />
      </div>

      {/* ── Recessed content well ── */}
      <div
        className="flex-1 overflow-y-auto min-h-0 scrollbar-thin relative"
        style={{
          backgroundColor: "hsl(var(--panel-content))",
          boxShadow: "inset 0 3px 6px hsl(var(--panel-inset)), inset 0 0 1px hsl(0 0% 0% / 0.04)",
        }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "256px 256px",
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

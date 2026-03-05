import { X } from "lucide-react";

interface Props {
  id: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const WorkstationPanel = ({ id, title, onClose, children, style }: Props) => {
  return (
    <div className="flex flex-col h-full min-w-0 border-r border-border-subtle last:border-r-0 bg-background" style={{ flex: 1, ...style }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle shrink-0">
        <h3 className="font-mono-brand text-[11px] text-muted-foreground tracking-widest uppercase truncate">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0 ml-2"
          title="Close panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
        {children}
      </div>
    </div>
  );
};

export default WorkstationPanel;

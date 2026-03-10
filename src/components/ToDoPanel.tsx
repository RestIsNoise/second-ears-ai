import { useState, useRef, useCallback } from "react";
import { Check, Plus, CircleDashed, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToDoItem } from "@/types/feedback";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

type Filter = "all" | "open" | "done";

interface Props {
  items: ToDoItem[];
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onItemClick: (item: ToDoItem) => void;
  loading?: boolean;
}

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const ToDoPanel = ({ items, onToggle, onAdd, onItemClick, loading }: Props) => {
  const [filter, setFilter] = useState<Filter>("all");
  const [noteText, setNoteText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const filtered = items.filter((item) => {
    if (filter === "open") return !item.done;
    if (filter === "done") return item.done;
    return true;
  });

  const handleSubmitNote = useCallback(() => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNoteText("");
    inputRef.current?.focus();
  }, [noteText, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitNote();
      }
    },
    [handleSubmitNote]
  );

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header — console style */}
      <div
        className="px-3 pt-3 pb-2.5"
        style={{ borderBottom: "1px solid hsl(var(--foreground) / 0.06)" }}
      >
        {totalCount > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <span
              className="tabular-nums font-medium"
              style={{ fontFamily: MONO, fontSize: 9, color: "hsl(var(--foreground) / 0.45)" }}
            >
              {doneCount}/{totalCount}
            </span>
            <div
              className="flex-1 h-[3px] rounded-sm overflow-hidden"
              style={{ backgroundColor: "hsl(var(--foreground) / 0.06)" }}
            >
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: "hsl(var(--foreground) / 0.25)",
                }}
              />
            </div>
          </div>
        )}

        {/* Filter tabs — hardware toggle style */}
        <div
          className="flex items-center gap-0 rounded-sm overflow-hidden"
          style={{
            border: "1px solid hsl(var(--foreground) / 0.08)",
          }}
        >
          {filters.map((f, i) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-1 px-2 py-[5px] text-[9px] font-bold uppercase tracking-[0.08em] transition-all duration-100"
              style={{
                fontFamily: MONO,
                color: filter === f.key ? "hsl(var(--foreground) / 0.8)" : "hsl(var(--foreground) / 0.3)",
                backgroundColor: filter === f.key ? "hsl(var(--panel-bg))" : "transparent",
                borderRight: i < filters.length - 1 ? "1px solid hsl(var(--foreground) / 0.06)" : "none",
                boxShadow: filter === f.key ? "inset 0 1px 2px hsl(var(--panel-inset))" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1.5 pb-2 scrollbar-thin">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <CircleDashed className="w-5 h-5 animate-spin text-foreground/20" />
            <p className="text-[10px] text-foreground/30" style={{ fontFamily: MONO }}>
              Loading…
            </p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex items-center justify-center py-6 px-3">
            <div
              className="flex flex-col items-center gap-2 rounded-sm px-4 py-5 w-full max-w-[190px]"
              style={{
                border: "1px dashed hsl(var(--foreground) / 0.1)",
                backgroundColor: "hsl(var(--panel-bg))",
              }}
            >
              <ClipboardList className="w-4 h-4 text-foreground/15" />
              <p className="text-[9px] text-center text-foreground/30" style={{ fontFamily: MONO }}>
                {filter === "done" ? "No completed tasks" : filter === "open" ? "All clear" : "Track your fixes"}
              </p>
              <button
                onClick={() => inputRef.current?.focus()}
                className="rounded-sm px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all duration-100"
                style={{
                  fontFamily: MONO,
                  backgroundColor: "hsl(var(--foreground) / 0.08)",
                  color: "hsl(var(--foreground) / 0.5)",
                  border: "1px solid hsl(var(--foreground) / 0.08)",
                }}
              >
                Add task
              </button>
            </div>
          </div>
        )}

        {filtered.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="w-full text-left flex items-start gap-2 px-2.5 py-2 rounded-sm transition-colors group hover:bg-foreground/[0.03]"
            style={{
              borderBottom: idx < filtered.length - 1 ? "1px solid hsl(var(--foreground) / 0.04)" : "none",
            }}
          >
            {/* Checkbox — hardware toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(item.id);
              }}
              className="mt-[2px] shrink-0 flex items-center justify-center transition-all duration-100"
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                border: item.done
                  ? "1px solid hsl(var(--foreground) / 0.12)"
                  : "1px solid hsl(var(--foreground) / 0.2)",
                backgroundColor: item.done ? "hsl(var(--foreground) / 0.06)" : "transparent",
              }}
            >
              {item.done && <Check className="w-2.5 h-2.5 text-foreground/35" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[11px] leading-snug transition-colors",
                  item.done ? "line-through text-foreground/25" : "text-foreground/65"
                )}
                style={{ fontFamily: MONO }}
              >
                {item.text}
              </p>
              {item.timestampSec > 0 && (
                <span
                  className="tabular-nums mt-0.5 block text-foreground/25"
                  style={{ fontFamily: MONO, fontSize: 8 }}
                >
                  @{formatTime(item.timestampSec)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Input — console command line */}
      <div
        className="px-3 py-2.5"
        style={{
          borderTop: "1px solid hsl(var(--foreground) / 0.08)",
          boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.03)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-foreground/20" style={{ fontFamily: MONO, fontSize: 10 }}>›</span>
          <input
            ref={inputRef}
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="add task…"
            className="flex-1 bg-transparent text-[11px] outline-none text-foreground/60 placeholder:text-foreground/20"
            style={{ fontFamily: MONO }}
          />
          <button
            onClick={handleSubmitNote}
            disabled={!noteText.trim()}
            className="text-[9px] transition-colors disabled:opacity-20 text-foreground/40 hover:text-foreground/70 uppercase tracking-wider font-bold"
            style={{ fontFamily: MONO }}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToDoPanel;

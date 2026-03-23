import { useState, useRef, useCallback } from "react";
import { Check, Plus, CircleDashed, ClipboardList, X } from "lucide-react";
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
  onDelete?: (id: string) => void;
  onItemClick: (item: ToDoItem) => void;
  loading?: boolean;
}

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const ToDoPanel = ({ items, onToggle, onAdd, onDelete, onItemClick, loading }: Props) => {
  const [filter, setFilter] = useState<Filter>("all");
  const [noteText, setNoteText] = useState("");
  const [showInput, setShowInput] = useState(false);
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
      {/* Header */}
      <div className="px-4 pt-4 pb-4" style={{ borderBottom: "1px solid hsl(0 0% 94%)" }}>
        {totalCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="tabular-nums"
              style={{ fontFamily: MONO, fontSize: 13, color: "hsl(var(--foreground) / 0.5)" }}
            >
              {doneCount}/{totalCount}
            </span>
            <div
              className="flex-1 h-[4px] rounded-sm overflow-hidden"
              style={{ backgroundColor: "hsl(var(--foreground) / 0.06)" }}
            >
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{ width: `${progressPct}%`, backgroundColor: "hsl(var(--foreground) / 0.25)" }}
              />
            </div>
          </div>
        )}

        {/* Segmented control */}
        <div
          className="flex items-center gap-0 p-1"
          style={{ backgroundColor: "hsl(0 0% 94%)", borderRadius: 6 }}
        >
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-1 uppercase tracking-[0.06em] transition-all duration-100"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 4,
                color: filter === f.key ? "hsl(0 0% 7%)" : "hsl(0 0% 60%)",
                backgroundColor: filter === f.key ? "hsl(0 0% 100%)" : "transparent",
                boxShadow: filter === f.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                fontWeight: filter === f.key ? 600 : 400,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-2 scrollbar-thin">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <CircleDashed className="w-5 h-5 animate-spin text-foreground/20" />
            <p style={{ fontFamily: MONO, fontSize: 10, color: "hsl(var(--foreground) / 0.3)" }}>Loading…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex items-center justify-center py-6 px-3">
            <div
              className="flex flex-col items-center gap-2 px-4 py-5 w-full max-w-[190px]"
              style={{ border: "1px dashed hsl(0 0% 80%)", borderRadius: 6 }}
            >
              <ClipboardList className="w-4 h-4" style={{ color: "hsl(var(--foreground) / 0.15)" }} />
              <p style={{ fontFamily: MONO, fontSize: 10, color: "hsl(var(--foreground) / 0.35)", textAlign: "center" }}>
                {filter === "done" ? "No completed tasks" : filter === "open" ? "All clear" : "Track your fixes"}
              </p>
            </div>
          </div>
        )}

        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="w-full text-left flex items-start group"
            style={{ padding: "10px 0", borderBottom: "1px solid hsl(0 0% 94%)", gap: 10 }}
          >
            {/* Checkbox */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
              className="mt-[1px] shrink-0 flex items-center justify-center transition-all duration-100"
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                border: item.done ? "1px solid hsl(0 0% 80%)" : "1px solid hsl(0 0% 87%)",
                backgroundColor: item.done ? "hsl(var(--foreground) / 0.06)" : "transparent",
              }}
            >
              {item.done && <Check className="w-2.5 h-2.5 text-foreground/35" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: item.done ? "hsl(0 0% 73%)" : "hsl(0 0% 20%)",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.text}
              </p>
              {item.timestampSec > 0 && (
                <span
                  className="tabular-nums mt-0.5 block"
                  style={{ fontFamily: MONO, fontSize: 11, color: "hsl(var(--foreground) / 0.28)" }}
                >
                  @{formatTime(item.timestampSec)}
                </span>
              )}
            </div>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove"
              >
                <X className="w-3 h-3" style={{ color: "hsl(0 0% 60%)" }} />
              </button>
            )}
          </button>
        ))}
      </div>

      {/* Bottom area: Add task button + inline input */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid hsl(0 0% 94%)" }}>
        {showInput ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!noteText.trim()) setShowInput(false); }}
              placeholder="add a task..."
              autoFocus
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: MONO,
                fontSize: 13,
                color: "hsl(0 0% 20%)",
                padding: "8px 0",
                border: "none",
              }}
            />
            <button
              onClick={handleSubmitNote}
              disabled={!noteText.trim()}
              className="transition-colors disabled:opacity-20"
              style={{ color: "hsl(var(--foreground) / 0.4)" }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="w-full flex items-center justify-center gap-2 transition-colors"
            style={{
              border: "1px dashed hsl(0 0% 80%)",
              background: "transparent",
              color: "hsl(0 0% 60%)",
              padding: 10,
              borderRadius: 6,
              fontFamily: MONO,
              fontSize: 12,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(0 0% 7%)"; e.currentTarget.style.color = "hsl(0 0% 7%)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(0 0% 80%)"; e.currentTarget.style.color = "hsl(0 0% 60%)"; }}
          >
            <Plus className="w-3.5 h-3.5" />
            ADD TASK
          </button>
        )}
      </div>
    </div>
  );
};

export default ToDoPanel;

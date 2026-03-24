import { useState, useRef, useCallback, useMemo } from "react";
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
  const isDark = useMemo(() => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark", []);

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
      <div className="px-4 pt-4 pb-4" style={{ borderBottom: isDark ? "1px solid #222" : "1px solid #e0e0e0" }}>
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
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "hsl(0 0% 94%)",
            borderRadius: 6,
            borderBottom: isDark ? "1px solid #222" : "1px solid #e0e0e0",
          }}
        >
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-1 uppercase tracking-[0.06em]"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 4,
                color: filter === f.key
                  ? (isDark ? "#111" : "white")
                  : (isDark ? "#666" : "hsl(0 0% 60%)"),
                backgroundColor: filter === f.key
                  ? (isDark ? "#e8e8e0" : "#111")
                  : "transparent",
                boxShadow: filter === f.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                fontWeight: filter === f.key ? 600 : 400,
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (filter !== f.key) {
                  e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== f.key) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
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
          <div className="flex items-center justify-center" style={{ margin: 16 }}>
            <div
              className="flex flex-col items-center gap-2 w-full"
              style={{
                border: isDark ? "1px dashed #2a2a2a" : "1px dashed #ddd",
                borderRadius: 4,
                padding: 20,
              }}
            >
              <ClipboardList style={{ width: 28, height: 28, color: isDark ? "#444" : "#ccc" }} />
              <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: "#aaa", textAlign: "center" }}>
                {filter === "done" ? "No completed tasks" : filter === "open" ? "All clear" : "Track your fixes"}
              </p>
              {filter === "all" && (
                <p style={{ fontFamily: MONO, fontSize: 10, color: "#bbb", textAlign: "center" }}>
                  Add fixes from feedback cards ↑
                </p>
              )}
            </div>
          </div>
        )}

        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="w-full text-left flex items-start group"
            style={{
              padding: "10px 12px",
              borderBottom: isDark ? "1px solid #1a1a1a" : "1px solid #f0f0ee",
              gap: 10,
              transition: "opacity 0.3s ease",
            }}
          >
            {/* Checkbox */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
              className="mt-[1px] shrink-0 flex items-center justify-center"
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                border: item.done
                  ? (isDark ? "1px solid #333" : "1px solid hsl(0 0% 80%)")
                  : (isDark ? "1px solid #444" : "1px solid hsl(0 0% 87%)"),
                backgroundColor: item.done ? "hsl(var(--foreground) / 0.06)" : "transparent",
                transition: "transform 0.1s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {item.done && <Check className="w-2.5 h-2.5 text-foreground/35" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: item.done
                    ? "#aaa"
                    : (isDark ? "#ccc" : "hsl(0 0% 20%)"),
                  textDecoration: item.done ? "line-through" : "none",
                  transition: "all 0.2s ease",
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
                <X className="w-3 h-3" style={{ color: isDark ? "#555" : "hsl(0 0% 60%)" }} />
              </button>
            )}
          </button>
        ))}
      </div>

      {/* Bottom area: Add task button + inline input */}
      <div className="px-4 py-3" style={{ borderTop: isDark ? "1px solid #222" : "1px solid hsl(0 0% 94%)" }}>
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
                color: isDark ? "#ccc" : "hsl(0 0% 20%)",
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
            className="w-full flex items-center justify-center gap-2 group/add"
            style={{
              border: isDark ? "1px dashed #333" : "1px dashed hsl(0 0% 80%)",
              background: "transparent",
              color: isDark ? "#666" : "#888",
              padding: 10,
              borderRadius: 6,
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.12em",
              cursor: "pointer",
              transition: "color 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = isDark ? "#666" : "#999";
              e.currentTarget.style.color = isDark ? "#ccc" : "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDark ? "#333" : "hsl(0 0% 80%)";
              e.currentTarget.style.color = isDark ? "#666" : "#888";
            }}
          >
            <Plus className="w-3.5 h-3.5 transition-transform duration-150 group-hover/add:scale-[1.2]" />
            ADD TASK
          </button>
        )}
      </div>
    </div>
  );
};

export default ToDoPanel;

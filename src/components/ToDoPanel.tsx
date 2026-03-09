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

const NOTEBOOK_BG = "#FAFAF7";
const RULED_LINE = "rgba(180, 170, 155, 0.18)";
const SERIF_FONT = "'Georgia', 'Palatino', 'Times New Roman', serif";

/* Ruled-lines background as repeating gradient */
const ruledBg = {
  backgroundImage: `repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 31px,
    ${RULED_LINE} 31px,
    ${RULED_LINE} 32px
  )`,
  backgroundPositionY: 8,
};

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
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden rounded-b-lg"
      style={{ backgroundColor: NOTEBOOK_BG }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2.5" style={{ backgroundColor: NOTEBOOK_BG }}>
        {totalCount > 0 && (
          <div className="flex items-center gap-2 mb-2.5">
            <span
              className="tabular-nums"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: "rgba(120, 110, 95, 0.6)",
              }}
            >
              {doneCount}/{totalCount} done
            </span>
            <div className="flex-1 h-[3px] rounded-full" style={{ backgroundColor: "rgba(180, 170, 155, 0.2)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: "rgba(120, 110, 95, 0.35)",
                }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5"
          style={{ backgroundColor: "rgba(180, 170, 155, 0.12)" }}
        >
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-150",
                filter === f.key
                  ? "shadow-sm"
                  : "hover:opacity-80"
              )}
              style={{
                fontFamily: SERIF_FONT,
                color: filter === f.key ? "rgba(60, 55, 45, 0.85)" : "rgba(120, 110, 95, 0.5)",
                backgroundColor: filter === f.key ? NOTEBOOK_BG : "transparent",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div
        className="flex-1 overflow-y-auto min-h-0 px-2 pb-2"
        style={ruledBg}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <CircleDashed className="w-5 h-5 animate-spin" style={{ color: "rgba(150, 140, 125, 0.3)" }} />
            <p className="text-[11px]" style={{ color: "rgba(120, 110, 95, 0.45)", fontFamily: SERIF_FONT }}>
              Loading tasks…
            </p>
          </div>
        )}

        {/* Empty state — card with icon + CTA */}
        {!loading && filtered.length === 0 && (
          <div className="flex items-center justify-center py-6 px-3">
            <div
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-5 w-full max-w-[200px]"
              style={{ borderColor: "rgba(180, 170, 155, 0.3)", backgroundColor: "rgba(245, 242, 238, 0.4)" }}
            >
              <ClipboardList className="w-5 h-5" style={{ color: "rgba(140, 130, 115, 0.35)" }} />
              <p
                className="text-[11px] text-center leading-snug"
                style={{ color: "rgba(90, 82, 70, 0.6)", fontFamily: SERIF_FONT }}
              >
                {filter === "done" ? "No completed tasks yet" : filter === "open" ? "All tasks done!" : "Track your mix fixes"}
              </p>
              <button
                onClick={() => inputRef.current?.focus()}
                className="rounded-full px-3 py-1 text-[10px] font-medium transition-all duration-150"
                style={{
                  fontFamily: SERIF_FONT,
                  backgroundColor: "rgba(60, 55, 45, 0.85)",
                  color: "#FAFAF7",
                }}
              >
                Add first task
              </button>
            </div>
          </div>
        )}

        {filtered.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors group"
            style={{
              borderBottom: idx < filtered.length - 1 ? `1px solid ${RULED_LINE}` : "none",
            }}
          >
            {/* Hand-drawn style checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(item.id);
              }}
              className="mt-0.5 shrink-0 flex items-center justify-center transition-all duration-150"
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: item.done
                  ? "1.5px solid rgba(120, 110, 95, 0.2)"
                  : "1.5px solid rgba(150, 140, 125, 0.35)",
                backgroundColor: item.done ? "rgba(120, 110, 95, 0.06)" : "transparent",
                transform: "rotate(-1deg)",
              }}
            >
              {item.done && <Check className="w-2.5 h-2.5" style={{ color: "rgba(100, 90, 75, 0.45)" }} />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[12px] leading-relaxed transition-colors",
                  item.done ? "line-through" : ""
                )}
                style={{
                  fontFamily: SERIF_FONT,
                  color: item.done ? "rgba(140, 130, 115, 0.4)" : "rgba(60, 55, 45, 0.75)",
                }}
              >
                {item.text}
              </p>
              {item.timestampSec > 0 && (
                <span
                  className="tabular-nums mt-0.5 block"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    color: "rgba(150, 140, 125, 0.4)",
                  }}
                >
                  {formatTime(item.timestampSec)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Add note — styled as text link */}
      <div
        className="px-4 py-3"
        style={{
          borderTop: `1px solid ${RULED_LINE}`,
          backgroundColor: NOTEBOOK_BG,
        }}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note…"
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{
              fontFamily: SERIF_FONT,
              color: "rgba(60, 55, 45, 0.7)",
              caretColor: "rgba(120, 110, 95, 0.6)",
            }}
          />
          <button
            onClick={handleSubmitNote}
            disabled={!noteText.trim()}
            className="text-[11px] transition-colors disabled:opacity-30"
            style={{
              fontFamily: SERIF_FONT,
              color: "rgba(120, 110, 95, 0.55)",
            }}
          >
            <span className="flex items-center gap-1">
              <Plus className="w-3 h-3" />
              add
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToDoPanel;

import { useState, useRef, useCallback } from "react";
import { Check, Plus, ListChecks, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
      {/* Header */}
      <div className="px-4 pt-3 pb-2.5">
        {totalCount > 0 && (
          <div className="flex items-center gap-2 mb-2.5">
            <span
              className="text-muted-foreground/50 tabular-nums"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
            >
              {doneCount}/{totalCount} done
            </span>
            <div className="flex-1">
              <Progress value={progressPct} className="h-[3px] bg-muted/30" />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-0.5 rounded-lg bg-secondary/30 p-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-150",
                filter === f.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground/50 hover:text-foreground/70"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <CircleDashed className="w-5 h-5 text-muted-foreground/20 animate-spin" />
            <p className="text-[11px] text-muted-foreground/40">Loading tasks…</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-1.5">
            <ListChecks className="w-5 h-5 text-muted-foreground/15" />
            <p className="text-[11px] text-muted-foreground/40">
              {filter === "done" ? "No completed tasks" : filter === "open" ? "All caught up!" : "No tasks yet"}
            </p>
            <p className="text-[9px] text-muted-foreground/25 max-w-[140px]">
              {filter === "all" && 'Click "Add to To-Do" on feedback cards or add a note below'}
            </p>
          </div>
        )}
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors group"
          >
            {/* Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(item.id);
              }}
              className={cn(
                "mt-0.5 w-[14px] h-[14px] rounded border shrink-0 flex items-center justify-center transition-all duration-150",
                item.done
                  ? "bg-foreground/8 border-foreground/12"
                  : "border-border-subtle hover:border-foreground/25 hover:bg-secondary/40"
              )}
            >
              {item.done && <Check className="w-2 h-2 text-foreground/40" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[11px] leading-snug transition-colors",
                  item.done ? "text-muted-foreground/35 line-through" : "text-foreground/75"
                )}
              >
                {item.text}
              </p>
              {item.timestampSec > 0 && (
                <span
                  className="text-muted-foreground/30 tabular-nums mt-0.5 block"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
                >
                  {formatTime(item.timestampSec)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Add note input */}
      <div className="px-3 py-2.5 border-t border-border-subtle/40 bg-secondary/10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note…"
            className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/30 outline-none"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSubmitNote}
            disabled={!noteText.trim()}
            className="h-6 w-6 p-0 text-muted-foreground/40 hover:text-foreground"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ToDoPanel;

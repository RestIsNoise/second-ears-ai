import { useState, useRef, useCallback } from "react";
import { Check, Plus, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
}

const ToDoPanel = ({ items, onToggle, onAdd, onItemClick }: Props) => {
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
    <div className="rounded-xl border border-border-subtle bg-background flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">To-Do List</h3>
          {totalCount > 0 && (
            <span
              className="text-muted-foreground/60 tabular-nums ml-auto"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
            >
              {doneCount}/{totalCount}
            </span>
          )}
        </div>

        {totalCount > 0 && (
          <Progress value={progressPct} className="h-1 bg-muted/40" />
        )}

        {/* Filters */}
        <div className="flex items-center gap-1 mt-3">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                filter === f.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-muted-foreground/50">
              {filter === "done" ? "No completed tasks yet" : filter === "open" ? "All done!" : "No tasks yet"}
            </p>
            <p className="text-[10px] text-muted-foreground/35 mt-1">
              Click "Add to To-Do" on any feedback card
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
              className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                item.done
                  ? "bg-foreground/10 border-foreground/15"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              {item.done && <Check className="w-2.5 h-2.5 text-foreground/50" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={`text-xs leading-snug ${
                  item.done ? "text-muted-foreground/40 line-through" : "text-foreground/80"
                }`}
              >
                {item.text}
              </p>
              <span
                className="text-muted-foreground/40 tabular-nums mt-0.5 block"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
              >
                {formatTime(item.timestampSec)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Add note input */}
      <div className="p-3 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note…"
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSubmitNote}
            disabled={!noteText.trim()}
            className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-foreground"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ToDoPanel;

export type Severity = "low" | "med" | "high";

export interface FeedbackItem {
  id: string;
  timestampSec: number;
  title: string;
  observation: string;
  fix: string;
  severity: Severity;
  mode: string;
}

export interface WaveformMarker {
  id: string;
  time: number;
  label: string;
  severity: Severity;
}

export interface ToDoItem {
  id: string;
  text: string;
  timestampSec: number;
  done: boolean;
  sourceId?: string; // links back to a FeedbackItem
}

/**
 * normalizeFeedbackResponse — single source of truth for backend → UI shape mapping.
 *
 * Handles snake_case / camelCase, mode-specific schemas, string arrays,
 * missing fields, and metric aliases. Never throws.
 */

export type ListeningMode = "technical" | "musical" | "perception";

export interface NormalizedTimelineItem {
  timestamp: string; // "MM:SS"
  timestampSec: number;
  title: string;
  description: string;
  actionLabel: "FIX" | "ARRANGE";
  actionText: string;
}

export interface NormalizedWhatWorks {
  title: string;
  description: string;
}

export interface NormalizedFixOne {
  title: string;
  why: string;
  how: string;
}

export interface NormalizedYourFocus {
  question: string | null;
  response: string | null;
}

export interface NormalizedFullAnalysis {
  mixBalance?: string;
  dynamics?: string;
  stereoSpace?: string;
  frequencyBalance?: string;
  energyArc?: string;
  sectionContrast?: string;
  grooveContinuity?: string;
  hookClarity?: string;
  subLowTranslation?: string;
  headroomTransients?: string;
  stereoFoldDown?: string;
  listenerFatigue?: string;
}

export interface NormalizedMetrics {
  integratedLufs: number | null;
  shortTermLufs: number | null;
  dynamicRange: number | null;
  peakDbtp: number | null;
  stereoCorrelation: number | null;
  crestFactor: number | null;
  subKickRatio: number | null;
  lra: number | null;
}

export interface NormalizedFeedback {
  trackName: string;
  mode: ListeningMode;
  overallImpression: string;
  topIssue: string;
  biggestWin: string;
  releaseStatus: string | null;
  timelineItems: NormalizedTimelineItem[];
  whatWorks: NormalizedWhatWorks[];
  ifFixOneThing: NormalizedFixOne | null;
  yourFocus: NormalizedYourFocus;
  fullAnalysis: NormalizedFullAnalysis;
  metrics: NormalizedMetrics;
}

// ─── Helpers ──────────────────────────────────────────────────

function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return String(v).trim();
}

function num(v: unknown): number | null {
  if (v == null) return null;
  // Handle "-inf" / "inf" strings from backend
  if (typeof v === "string") {
    const lower = v.trim().toLowerCase();
    if (lower === "-inf" || lower === "-infinity") return -100;
    if (lower === "inf" || lower === "infinity") return 100;
  }
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function parseTimeSec(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const match = val.match(/^(\d+):(\d+)$/);
    if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    const n = parseFloat(val);
    if (Number.isFinite(n)) return n;
  }
  return -1;
}

function formatTimestamp(sec: number): string {
  if (sec < 0 || !Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Pick first non-nil value from an object using multiple key aliases */
function pick(obj: any, ...keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
  }
  return undefined;
}

/** Pick across multiple source objects */
function pickFrom(sources: any[], ...keys: string[]): unknown {
  for (const src of sources) {
    const v = pick(src, ...keys);
    if (v != null) return v;
  }
  return undefined;
}

const FILLER_WORDS = /^(the|a|an|its|their|this|that|very|really|quite|just|some|overall)\s+/gi;
const SLOPPY_SEPARATORS = /[\/,;]+/g;

function toTitleCase(s: string): string {
  return s
    .replace(SLOPPY_SEPARATORS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function cleanChipLabel(raw: string): string {
  if (!raw) return "";
  // Remove sloppy separators, filler words, extra whitespace
  let cleaned = raw
    .replace(SLOPPY_SEPARATORS, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Strip leading filler words (up to 2 passes)
  cleaned = cleaned.replace(FILLER_WORDS, "").replace(FILLER_WORDS, "").trim();
  // Take first 4 meaningful words max
  const words = cleaned.split(/\s+/).slice(0, 4);
  return toTitleCase(words.join(" "));
}

function extractShortLabel(t: string): string {
  return cleanChipLabel(t);
}

function normalizeWhatWorksItem(item: unknown): NormalizedWhatWorks {
  if (typeof item === "string") {
    const sentences = item.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 1) {
      return { title: sentences[0].trim(), description: sentences.slice(1).join("").trim() };
    }
    const words = item.split(/\s+/);
    return { title: words.slice(0, 5).join(" "), description: item };
  }
  if (item && typeof item === "object") {
    const o = item as any;
    let title = str(o.title) || "Untitled";
    let desc = str(o.detail) || str(o.description) || str(o.whyItWorks) || str(o.body) || str(o.text) || "";
    // If title-only with multiple sentences, split
    if (!desc && title) {
      const sentences = title.match(/[^.!?]+[.!?]+/g);
      if (sentences && sentences.length > 1) {
        desc = sentences.slice(1).join("").trim();
        title = sentences[0].trim();
      }
    }
    return { title, description: desc };
  }
  return { title: "Untitled", description: "" };
}

// ─── Main normalizer ──────────────────────────────────────────

export function normalizeFeedbackResponse(
  raw: any,
  mode: ListeningMode,
  context?: string,
  fileName?: string,
): NormalizedFeedback {
  // Unwrap: feedback may be nested or top-level
  let fb = raw?.feedback ?? raw;

  // Safety: re-parse if overall_impression contains a JSON blob
  if (
    fb &&
    typeof fb.overall_impression === "string" &&
    fb.overall_impression.trim().startsWith("{") &&
    !fb.top_priorities?.length
  ) {
    try {
      const reparsed = JSON.parse(fb.overall_impression);
      if (reparsed && typeof reparsed === "object" && reparsed.overall_impression) {
        console.warn("[normalizeFeedback] Re-parsed feedback from overall_impression JSON string");
        fb = reparsed;
      }
    } catch {
      console.warn("[normalizeFeedback] overall_impression looks like JSON but parse failed");
    }
  }

  if (!fb || typeof fb !== "object") {
    console.warn("[normalizeFeedback] No feedback object found in response");
    fb = {};
  }

  const sources = [fb, raw?.metrics, raw];

  // ── Track name
  const trackName = str(fb.track_name) || str(fb.trackName) || fileName || "Untitled Track";

  // ── Overall impression
  const overallRaw = str(fb.overallImpression) || str(fb.overall_impression) || "";
  const overallSentences = overallRaw.match(/[^.!?]+[.!?]+/g);
  const overallImpression = overallSentences ? overallSentences.slice(0, 3).join("").trim() : overallRaw;

  // ── Timeline items (mode-specific)
  const timelineItems: NormalizedTimelineItem[] = [];
  let rawPriorities: any[] = [];
  let actionLabel: "FIX" | "ARRANGE" = "FIX";

  // Check for already-normalized timelineItems (e.g. loaded from DB)
  const preNormalized = fb.timelineItems;
  if (Array.isArray(preNormalized) && preNormalized.length > 0) {
    preNormalized.forEach((item: any) => {
      const sec = parseTimeSec(item.timestampSec ?? item.timestamp ?? item.time);
      timelineItems.push({
        timestamp: str(item.timestamp) || formatTimestamp(sec >= 0 ? sec : 0),
        timestampSec: sec >= 0 ? sec : -1,
        title: str(item.title) || "Untitled",
        description: str(item.description),
        actionLabel: item.actionLabel === "ARRANGE" ? "ARRANGE" : "FIX",
        actionText: str(item.actionText),
      });
    });
  } else if (mode === "musical") {
    actionLabel = "ARRANGE";
    const src = fb.arrangementNotes || fb.arrangement_notes || fb.top_priorities || fb.priorities || [];
    rawPriorities = (Array.isArray(src) ? src : []).map((p: any) => ({
      title: str(p.section) || str(p.title),
      description: str(p.observation) || str(p.why) || str(p.description),
      actionText: str(p.arrangement_move) || str(p.suggestion) || str(p.fix),
      time: p.timestamp ?? p.timestampSec ?? p.time,
    }));
  } else if (mode === "perception") {
    actionLabel = "FIX";
    const src = fb.systemNotes || fb.system_notes || fb.top_priorities || fb.priorities || [];
    rawPriorities = (Array.isArray(src) ? src : []).map((p: any) => {
      const desc = str(p.observation) || str(p.title) || str(p.description);
      const risk = str(p.translationRisk) || str(p.translation_risk);
      return {
        title: str(p.title) || desc.split(/[.!?]/)[0]?.trim() || desc.slice(0, 60),
        description: risk ? `${desc} (${risk})` : desc,
        actionText: str(p.fix) || str(p.suggestion),
        time: p.timestamp ?? p.timestampSec ?? p.time,
      };
    });
  } else {
    // Technical
    actionLabel = "FIX";
    const src = fb.priorities || fb.top_priorities || [];
    rawPriorities = (Array.isArray(src) ? src : []).map((p: any) => ({
      title: str(p.issue) || str(p.title),
      description: str(p.whyItMatters) || str(p.why) || str(p.description),
      actionText: str(p.suggestedFix) || str(p.fix) || str(p.suggestion),
      time: p.timestamp ?? p.timestampSec ?? p.time,
    }));
  }

  // Also check for separate timestamps array
  const backendTimestamps: any[] = fb.timestamps || [];

  rawPriorities.forEach((p, i) => {
    let sec = parseTimeSec(p.time);
    // Fallback: check timestamps array
    if (sec < 0 && backendTimestamps[i]) {
      sec = parseTimeSec(backendTimestamps[i].time ?? backendTimestamps[i]);
    }
    timelineItems.push({
      timestamp: formatTimestamp(sec >= 0 ? sec : 0),
      timestampSec: sec >= 0 ? sec : -1,
      title: p.title || `Issue ${i + 1}`,
      description: p.description,
      actionLabel,
      actionText: p.actionText,
    });
  });

  if (timelineItems.length === 0 && rawPriorities.length === 0) {
    console.warn("[normalizeFeedback] No timeline items found for mode:", mode);
  }

  // ── What Works
  const rawWorks: any[] = (() => {
    if (mode === "musical") return fb.whatLands || fb.what_lands || fb.what_works || [];
    if (mode === "perception") return fb.whatTranslates || fb.what_translates || fb.what_works || [];
    return fb.whatWorks || fb.what_works || [];
  })();
  const whatWorks: NormalizedWhatWorks[] = (Array.isArray(rawWorks) ? rawWorks : []).map(normalizeWhatWorksItem);

  if (whatWorks.length === 0) {
    console.warn("[normalizeFeedback] No whatWorks items found");
  }

  // ── Fix One Thing
  const rawFix = (() => {
    if (mode === "musical") return fb.focusHere || fb.focus_here || fb.fix_one_thing || fb.ifFixOneThing;
    if (mode === "perception") return fb.urgentFix || fb.urgent_fix || fb.fix_one_thing || fb.ifFixOneThing;
    return fb.ifFixOneThing || fb.fixOneThingToday || fb.fix_one_thing;
  })();
  const ifFixOneThing: NormalizedFixOne | null = rawFix
    ? {
        title: str(rawFix.title),
        why: str(rawFix.why) || str(rawFix.whyItMatters),
        how: str(rawFix.how) || str(rawFix.suggestion) || str(rawFix.fix),
      }
    : null;

  // ── Top cards
  const topIssue = timelineItems[0]?.title ? extractShortLabel(timelineItems[0].title) : "";
  const biggestWin = whatWorks[0]?.title ? extractShortLabel(whatWorks[0].title) : "";

  // ── Release status
  const releaseStatus = (() => {
    const explicit = str(fb.release) || str(fb.readiness) || str(fb.releaseStatus) || str(fb.release_status);
    if (explicit) return explicit;
    return null; // will be computed from metrics in the component
  })();

  // ── Your Focus
  const question = context || str(fb.userContext) || str(fb.user_context) || str(fb.focusQuestion) || null;
  const focusResp =
    str(fb.focus_response) || str(fb.focusResponse) || str(fb.responseToRequest) || str(fb.yourFocus?.response) || null;
  const yourFocus: NormalizedYourFocus = {
    question,
    response: question && !focusResp ? "No direct focus response available for this run." : focusResp,
  };

  // ── Full Analysis
  const fa = fb.fullAnalysis || fb.full_analysis || {};
  const fullAnalysis: NormalizedFullAnalysis = {
    mixBalance: str(fa.mixBalance) || str(fa.mix_balance) || undefined,
    dynamics: str(fa.dynamics) || str(fa.dynamicsLoudness) || undefined,
    stereoSpace: str(fa.stereoSpace) || str(fa.stereo_space) || undefined,
    frequencyBalance: str(fa.frequencyBalance) || str(fa.frequency_balance) || undefined,
    energyArc: str(fa.energyArc) || str(fa.energy_arc) || undefined,
    sectionContrast: str(fa.sectionContrast) || str(fa.section_contrast) || undefined,
    grooveContinuity: str(fa.grooveContinuity) || str(fa.groove_continuity) || undefined,
    hookClarity: str(fa.hookClarity) || str(fa.hook_clarity) || undefined,
    subLowTranslation: str(fa.subLowTranslation) || str(fa.sub_low_translation) || undefined,
    headroomTransients: str(fa.headroomTransients) || str(fa.headroom_transients) || undefined,
    stereoFoldDown: str(fa.stereoFoldDown) || str(fa.stereo_fold_down) || undefined,
    listenerFatigue: str(fa.listenerFatigue) || str(fa.listener_fatigue) || undefined,
  };

  // ── Metrics
  const metricSources = [fb.technical_metrics, fb.metrics, fb, raw?.metrics, raw];
  const metrics: NormalizedMetrics = {
    integratedLufs: num(pickFrom(metricSources, "integrated_lufs", "integratedLufs", "integratedLoudness", "integratedLUFS")),
    shortTermLufs: num(pickFrom(metricSources, "short_term_lufs", "shortTermLufs", "rms")),
    dynamicRange: num(pickFrom(metricSources, "dynamic_range", "dynamicRange")),
    peakDbtp: num(pickFrom(metricSources, "peak_dbtp", "peakDbtp", "peakDbTP", "truePeak", "true_peak")),
    stereoCorrelation: num(pickFrom(metricSources, "stereo_correlation", "stereoCorrelation", "stereoWidth", "stereo_width")),
    crestFactor: num(pickFrom(metricSources, "crest_factor", "crestFactor", "transientDensity")),
    subKickRatio: num(pickFrom(metricSources, "sub_kick_ratio", "subKickRatio")),
    lra: num(pickFrom(metricSources, "lra", "loudnessRange", "loudness_range", "LRA")),
  };

  const hasAnyMetric = Object.values(metrics).some((v) => v !== null);
  if (!hasAnyMetric) {
    console.warn("[normalizeFeedback] No metric values found");
  }

  return {
    trackName,
    mode,
    overallImpression,
    topIssue,
    biggestWin,
    releaseStatus,
    timelineItems,
    whatWorks,
    ifFixOneThing,
    yourFocus,
    fullAnalysis,
    metrics,
  };
}

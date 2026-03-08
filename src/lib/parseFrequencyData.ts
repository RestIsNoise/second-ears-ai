export interface FrequencyData {
  sub: number;
  low: number;
  mid: number;
  high: number;
}

const STRENGTH_MAP: Record<string, number> = {
  weak: 0.25,
  light: 0.35,
  moderate: 0.5,
  balanced: 0.5,
  normal: 0.5,
  present: 0.6,
  strong: 0.75,
  heavy: 0.85,
  dominant: 0.9,
  excessive: 0.95,
};

function parseStrength(text: string): number {
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(STRENGTH_MAP)) {
    if (lower.includes(key)) return value;
  }
  // Try to extract a percentage
  const pctMatch = lower.match(/(\d+)%/);
  if (pctMatch) return parseInt(pctMatch[1], 10) / 100;
  // Try to extract a decimal
  const decMatch = lower.match(/0\.\d+/);
  if (decMatch) return parseFloat(decMatch[0]);
  return 0.5; // default
}

export function parseFrequencyData(
  technicalMetrics: Record<string, unknown> | null | undefined,
  feedbackItems?: Array<{ observation?: string; title?: string }> | null
): FrequencyData | null {
  // Try structured data first
  if (technicalMetrics) {
    const fb = technicalMetrics.frequencyBalance as Record<string, unknown> | undefined;
    if (fb && typeof fb === "object") {
      const getVal = (key: string): number => {
        const v = fb[key];
        if (typeof v === "number") return v > 1 ? v / 100 : v;
        if (typeof v === "string") return parseStrength(v);
        return 0.5;
      };
      return {
        sub: getVal("sub") || getVal("subBass") || 0.5,
        low: getVal("low") || getVal("bass") || getVal("lowEnd") || 0.5,
        mid: getVal("mid") || getVal("mids") || getVal("midrange") || 0.5,
        high: getVal("high") || getVal("highs") || getVal("treble") || getVal("highEnd") || 0.5,
      };
    }

    // Check for direct properties
    if ("sub" in technicalMetrics || "low" in technicalMetrics) {
      return {
        sub: typeof technicalMetrics.sub === "number" ? technicalMetrics.sub : 0.5,
        low: typeof technicalMetrics.low === "number" ? technicalMetrics.low : 0.5,
        mid: typeof technicalMetrics.mid === "number" ? technicalMetrics.mid : 0.5,
        high: typeof technicalMetrics.high === "number" ? technicalMetrics.high : 0.5,
      };
    }
  }

  // Try to extract from feedback text
  if (feedbackItems && feedbackItems.length > 0) {
    const allText = feedbackItems
      .map((f) => `${f.title || ""} ${f.observation || ""}`)
      .join(" ")
      .toLowerCase();

    const extractBand = (keywords: string[]): number => {
      for (const kw of keywords) {
        const idx = allText.indexOf(kw);
        if (idx >= 0) {
          const snippet = allText.slice(Math.max(0, idx - 30), idx + 50);
          return parseStrength(snippet);
        }
      }
      return 0.5;
    };

    return {
      sub: extractBand(["sub", "sub-bass", "subbass"]),
      low: extractBand(["low end", "bass", "low frequency"]),
      mid: extractBand(["mid", "midrange", "mids"]),
      high: extractBand(["high", "treble", "highs", "high frequency"]),
    };
  }

  return null;
}

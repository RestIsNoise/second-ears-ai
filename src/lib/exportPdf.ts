import jsPDF from "jspdf";
import type { NormalizedFeedback } from "@/lib/normalizeFeedback";

const MARGIN = 20;
const PAGE_W = 210; // A4
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_H = 5.5;
const SECTION_GAP = 10;

const modeLabels: Record<string, string> = {
  technical: "Technical Analysis",
  musical: "Musical Analysis",
  perception: "Perception Analysis",
};

const modeWhatWorksLabel: Record<string, string> = {
  technical: "What Works",
  musical: "What Lands",
  perception: "What Translates",
};

const modeFixOneLabel: Record<string, string> = {
  technical: "If You Fix Only One Thing Today",
  musical: "Focus Here",
  perception: "Urgent Fix",
};

function checkPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = LINE_H,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    y = checkPage(doc, y, lineHeight);
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  y = checkPage(doc, y, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 6;
  return y;
}

function bodyFont(doc: jsPDF) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
}

function labelFont(doc: jsPDF) {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
}

export function exportAnalysisPdf(n: NormalizedFeedback, releaseReadiness: string | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // ── Header
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("SecondEar", MARGIN, y);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(dateStr, PAGE_W - MARGIN, y, { align: "right" });
  y += 10;

  // ── Track name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 10, 10);
  doc.text(n.trackName, MARGIN, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(modeLabels[n.mode] || n.mode, MARGIN, y);
  y += SECTION_GAP;

  // ── Executive summary chips
  const chips: { label: string; value: string }[] = [];
  if (n.topIssue) chips.push({ label: "TOP ISSUE", value: n.topIssue });
  if (n.biggestWin) chips.push({ label: "BIGGEST WIN", value: n.biggestWin });
  if (releaseReadiness) chips.push({ label: "RELEASE", value: releaseReadiness });

  if (chips.length > 0) {
    for (const chip of chips) {
      y = checkPage(doc, y, 10);
      labelFont(doc);
      doc.text(chip.label, MARGIN, y);
      bodyFont(doc);
      doc.text(chip.value, MARGIN + 28, y);
      y += LINE_H;
    }
    y += 4;
  }

  // ── Overall impression
  if (n.overallImpression) {
    y = sectionTitle(doc, "Overall Impression", y);
    bodyFont(doc);
    y = addWrappedText(doc, n.overallImpression, MARGIN, y, CONTENT_W);
    y += SECTION_GAP;
  }

  // ── Timeline feedback
  if (n.timelineItems.length > 0) {
    y = sectionTitle(doc, "Timeline Feedback", y);
    for (const item of n.timelineItems) {
      y = checkPage(doc, y, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      const ts = item.timestampSec >= 0 ? item.timestamp : "";
      doc.text(`${ts ? ts + "  " : ""}${item.title}`, MARGIN, y);
      y += LINE_H;

      if (item.description) {
        bodyFont(doc);
        y = addWrappedText(doc, item.description, MARGIN + 2, y, CONTENT_W - 2);
      }
      if (item.actionText) {
        labelFont(doc);
        doc.text(item.actionLabel, MARGIN + 2, y);
        bodyFont(doc);
        y = addWrappedText(doc, item.actionText, MARGIN + 14, y, CONTENT_W - 14);
      }
      y += 3;
    }
    y += 4;
  }

  // ── Full Analysis
  const faCards = getFullAnalysisCards(n);
  const hasFA = faCards.some((c) => c.text);
  if (hasFA) {
    y = sectionTitle(doc, "Full Analysis", y);
    for (const card of faCards) {
      if (!card.text) continue;
      y = checkPage(doc, y, 14);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(card.label, MARGIN, y);
      y += LINE_H;
      bodyFont(doc);
      y = addWrappedText(doc, card.text, MARGIN + 2, y, CONTENT_W - 2);
      y += 3;
    }
    y += 4;
  }

  // ── Technical Metrics
  const m = n.metrics;
  const metricEntries: { label: string; value: string; status: string }[] = [];
  if (m.integratedLufs !== null)
    metricEntries.push({ label: "Integrated LUFS", value: `${m.integratedLufs.toFixed(1)} LUFS`, status: getMetricStatus("lufs", m.integratedLufs) });
  if (m.shortTermLufs !== null)
    metricEntries.push({ label: "Short-Term LUFS", value: `${m.shortTermLufs.toFixed(1)} LUFS`, status: getMetricStatus("stlufs", m.shortTermLufs) });
  if (m.dynamicRange !== null)
    metricEntries.push({ label: "Dynamic Range", value: `${m.dynamicRange.toFixed(1)} dB`, status: getMetricStatus("dr", m.dynamicRange) });
  if (m.peakDbtp !== null)
    metricEntries.push({ label: "Peak dBTP", value: `${m.peakDbtp.toFixed(1)} dBTP`, status: getMetricStatus("peak", m.peakDbtp) });
  if (m.stereoCorrelation !== null)
    metricEntries.push({ label: "Stereo Correlation", value: m.stereoCorrelation.toFixed(2), status: getMetricStatus("stereo", m.stereoCorrelation) });
  if (m.crestFactor !== null)
    metricEntries.push({ label: "Crest Factor", value: `${m.crestFactor.toFixed(1)} dB`, status: getMetricStatus("crest", m.crestFactor) });
  if (m.subKickRatio !== null)
    metricEntries.push({ label: "Sub/Kick Ratio", value: m.subKickRatio.toFixed(2), status: getMetricStatus("sub", m.subKickRatio) });

  if (metricEntries.length > 0) {
    y = sectionTitle(doc, "Technical Metrics", y);
    for (const me of metricEntries) {
      y = checkPage(doc, y, 7);
      labelFont(doc);
      doc.text(me.label, MARGIN, y);
      bodyFont(doc);
      doc.text(`${me.value}  (${me.status})`, MARGIN + 40, y);
      y += LINE_H;
    }
    y += SECTION_GAP;
  }

  // ── What Works
  if (n.whatWorks.length > 0) {
    y = sectionTitle(doc, modeWhatWorksLabel[n.mode] || "What Works", y);
    for (const item of n.whatWorks) {
      y = checkPage(doc, y, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(item.title, MARGIN, y);
      y += LINE_H;
      if (item.description) {
        bodyFont(doc);
        y = addWrappedText(doc, item.description, MARGIN + 2, y, CONTENT_W - 2);
      }
      y += 3;
    }
    y += 4;
  }

  // ── Fix One Thing
  if (n.ifFixOneThing && (n.ifFixOneThing.title || n.ifFixOneThing.how)) {
    y = sectionTitle(doc, modeFixOneLabel[n.mode] || "If You Fix Only One Thing", y);
    y = checkPage(doc, y, 18);
    if (n.ifFixOneThing.title) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(10, 10, 10);
      doc.text(n.ifFixOneThing.title, MARGIN, y);
      y += 6;
    }
    if (n.ifFixOneThing.why) {
      bodyFont(doc);
      y = addWrappedText(doc, `Why: ${n.ifFixOneThing.why}`, MARGIN, y, CONTENT_W);
    }
    if (n.ifFixOneThing.how) {
      bodyFont(doc);
      y = addWrappedText(doc, `How: ${n.ifFixOneThing.how}`, MARGIN, y, CONTENT_W);
    }
    y += SECTION_GAP;
  }

  // ── Your Focus
  if (n.yourFocus.question) {
    y = sectionTitle(doc, "Your Focus", y);
    y = checkPage(doc, y, 14);
    labelFont(doc);
    doc.text("YOU ASKED", MARGIN, y);
    y += LINE_H;
    bodyFont(doc);
    y = addWrappedText(doc, `"${n.yourFocus.question}"`, MARGIN + 2, y, CONTENT_W - 2);
    y += 3;
    if (n.yourFocus.response) {
      labelFont(doc);
      doc.text("RESPONSE", MARGIN, y);
      y += LINE_H;
      bodyFont(doc);
      y = addWrappedText(doc, n.yourFocus.response, MARGIN + 2, y, CONTENT_W - 2);
    }
    y += SECTION_GAP;
  }

  // ── Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("Generated by SecondEars", MARGIN, 290);
    doc.text(`${i} / ${pageCount}`, PAGE_W - MARGIN, 290, { align: "right" });
  }

  const safeName = n.trackName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
  doc.save(`SecondEars_${safeName}.pdf`);
}

// ── Helpers

function getFullAnalysisCards(n: NormalizedFeedback) {
  const fa = n.fullAnalysis;
  if (n.mode === "musical") {
    return [
      { label: "Energy Arc", text: fa.energyArc },
      { label: "Section Contrast", text: fa.sectionContrast },
      { label: "Groove Continuity", text: fa.grooveContinuity },
      { label: "Hook Clarity", text: fa.hookClarity },
    ];
  }
  if (n.mode === "perception") {
    return [
      { label: "Sub & Low Translation", text: fa.subLowTranslation },
      { label: "Headroom & Transients", text: fa.headroomTransients },
      { label: "Stereo Fold-Down", text: fa.stereoFoldDown },
      { label: "Listener Fatigue", text: fa.listenerFatigue },
    ];
  }
  return [
    { label: "Mix Balance", text: fa.mixBalance },
    { label: "Dynamics & Loudness", text: fa.dynamics },
    { label: "Stereo & Space", text: fa.stereoSpace },
    { label: "Frequency Balance", text: fa.frequencyBalance },
  ];
}

function getMetricStatus(type: string, val: number): string {
  switch (type) {
    case "lufs":
      if (val >= -14 && val <= -9) return "Good";
      if (val >= -16 && val <= -7) return "Acceptable";
      return "Needs attention";
    case "stlufs":
      if (val >= -12 && val <= -7) return "Good";
      return "Review";
    case "dr":
      if (val >= 6 && val <= 14) return "Good";
      if (val >= 4) return "Acceptable";
      return "Needs attention";
    case "peak":
      if (val <= -1) return "Good";
      if (val <= 0) return "Borderline";
      return "Clipping";
    case "stereo":
      if (val >= 0.5) return "Good";
      if (val >= 0.2) return "Wide";
      return "Very wide";
    case "crest":
      if (val >= 8 && val <= 18) return "Good";
      if (val >= 5) return "Acceptable";
      return "Compressed";
    case "sub":
      if (val >= 0.3 && val <= 0.7) return "Balanced";
      return "Review";
    default:
      return "";
  }
}

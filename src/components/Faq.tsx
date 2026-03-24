import { useState } from "react";
import { ChevronDown } from "lucide-react";

const items = [
  {
    q: "What does SecondEar analyze?",
    a: "We evaluate frequency balance, dynamic range, stereo image, loudness (LUFS/dBTP), and overall tonal quality. Depending on the listening mode you choose, feedback also covers arrangement density, vocal-instrument balance, emotional impact, and commercial readiness. Each analysis returns actionable priorities, not just observations.",
  },
  {
    q: "How long does analysis take?",
    a: "Most tracks are processed in 15–30 seconds. Files over 100 MB or in lossless formats like WAV may take up to a minute. Processing time also depends on current server load, but we aim to keep every result under 60 seconds.",
  },
  {
    q: "Do you support WAV/MP3/FLAC?",
    a: "Yes — we accept WAV, MP3, FLAC, AIFF, OGG, and most standard audio formats. The maximum file size is 200 MB per upload. For best results, upload a full-resolution mix (WAV or FLAC at 44.1 kHz or higher) rather than a compressed preview.",
  },
  {
    q: "Is this feedback for mastering or mixing?",
    a: "SecondEar is designed primarily for mix-stage evaluation: balance, dynamics, spatial placement, and frequency distribution. That said, many users find it useful for pre-master checks — identifying issues before sending a track to a mastering engineer. We don't replace mastering; we help you arrive with a stronger mix.",
  },
  {
    q: "Can I add reference context?",
    a: "Yes. The 'What are you going for?' field lets you describe your intent — genre, reference tracks, specific concerns, or creative goals. This context shapes the AI's feedback so it evaluates your mix against your vision, not a generic standard. We recommend keeping it to one or two sentences for best results.",
  },
  {
    q: "Is Human Review available?",
    a: "Yes. The Human Review plan pairs our AI analysis with a professional mixing engineer who listens to your track, records a video walkthrough, and provides personalized revision notes. Turnaround is typically 2–3 business days, and includes one follow-up exchange for clarifications.",
  },
  {
    q: "Is my audio private?",
    a: "Yes. Your files are uploaded over an encrypted connection and stored securely. They are never shared publicly or made accessible to other users. You can delete your tracks at any time from your account.",
  },
  {
    q: "Do you use my tracks to train AI models?",
    a: "No. Your audio is used solely to generate your feedback and is not included in any training datasets. We do not retain or repurpose your content for model development under any circumstances.",
  },
  {
    q: "What are the file length and size limits?",
    a: "The maximum file size is 200 MB per upload. There is no strict duration limit, but tracks longer than 15 minutes may produce less granular feedback. For best results, upload individual songs or focused sections rather than full DJ sets or album-length files.",
  },
  {
    q: "What happens if analysis fails or times out?",
    a: "If an analysis fails due to a server issue or timeout, you'll see an error message with the option to retry immediately. Your file remains uploaded, so you won't need to re-upload it. If the issue persists, contact us and we'll investigate.",
  },
  {
    q: "Can I re-run analysis after uploading a new version?",
    a: "Yes. Simply upload the updated file and run a new analysis. Each upload is treated independently, so you can compare feedback across versions to track your mix improvements over time.",
  },
  {
    q: "Can I cancel my plan anytime?",
    a: "Yes. You can cancel your subscription at any time — no lock-in, no cancellation fees. Your access continues until the end of your current billing period, and your existing reports remain available after cancellation.",
  },
];

const FaqItem = ({ item, isOpen, onToggle, isFirst, isDark }: { item: typeof items[0]; isOpen: boolean; onToggle: () => void; isFirst: boolean; isDark: boolean }) => (
  <div
    style={{
      borderBottom: `1px solid ${isDark ? "#222" : "#e8e8e8"}`,
      borderTop: isFirst ? "none" : undefined,
    }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between text-left cursor-pointer group"
      style={{ padding: "20px 0" }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: isDark ? "#c8c8c0" : "#111",
          transition: "color 0.15s ease",
        }}
      >
        {item.q}
      </span>
      <ChevronDown
        className="w-4 h-4 shrink-0 ml-4"
        style={{
          color: isDark ? "#555" : "#999",
          transition: "transform 0.2s ease",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>
    <div
      style={{
        overflow: "hidden",
        transition: "max-height 0.25s ease, opacity 0.2s ease",
        maxHeight: isOpen ? 500 : 0,
        opacity: isOpen ? 1 : 0,
      }}
    >
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: isDark ? "#999" : "#555",
          paddingBottom: 16,
        }}
      >
        {item.a}
      </p>
    </div>
  </div>
);

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="scroll-mt-20">
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px" }}>
        {/* Header */}
        <div className="mb-12">
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.15em",
              color: "#999",
              textTransform: "uppercase",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            FAQ
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Got questions?
          </h1>
          <p style={{ fontSize: 16, color: "#666", marginTop: 10, lineHeight: 1.5 }}>
            Everything you need to know about SecondEar.
          </p>
        </div>

        {/* Accordion */}
        <div>
          {items.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              isFirst={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;

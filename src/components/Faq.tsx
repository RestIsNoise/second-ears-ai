import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "What does SecondEars analyze?",
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
    a: "SecondEars is designed primarily for mix-stage evaluation: balance, dynamics, spatial placement, and frequency distribution. That said, many users find it useful for pre-master checks — identifying issues before sending a track to a mastering engineer. We don't replace mastering; we help you arrive with a stronger mix.",
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

const Faq = () => (
  <section className="py-14 md:py-16 px-6 border-t border-border-subtle">
    <div className="max-w-5xl mx-auto">
      <div className="max-w-2xl">
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
          Support
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
          Frequently asked
        </h2>
        <Accordion type="single" collapsible className="space-y-0">
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-border-subtle py-0"
            >
              <AccordionTrigger className="py-4 text-sm font-medium text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </section>
);

export default Faq;

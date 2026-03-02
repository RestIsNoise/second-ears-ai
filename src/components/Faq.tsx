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
];

const Faq = () => (
  <section className="py-16 md:py-20 px-6 border-t border-border-subtle">
    <div className="max-w-2xl mx-auto">
      <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">
        Support
      </p>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
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
  </section>
);

export default Faq;

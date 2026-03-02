import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "What does SecondEars analyze?",
    a: "We analyze frequency balance, dynamics, stereo image, loudness, and overall mix quality. Depending on your listening mode, we also cover arrangement, tonal clarity, and commercial readiness.",
  },
  {
    q: "How long does analysis take?",
    a: "Most tracks are analyzed in under 30 seconds. Longer or higher-resolution files may take up to a minute.",
  },
  {
    q: "Do you support WAV/MP3/FLAC?",
    a: "Yes. We accept WAV, MP3, FLAC, and most common audio formats up to 200 MB.",
  },
  {
    q: "Is this feedback for mastering or mixing?",
    a: "Primarily for mixing. Our analysis focuses on mix-level decisions like balance, dynamics, and spatial placement — though many insights apply to pre-master evaluation too.",
  },
  {
    q: "Can I add reference context?",
    a: "Yes. The 'What are you going for?' field lets you describe your intent, genre, or reference tracks. This shapes the feedback to match your creative goals.",
  },
  {
    q: "Is Human Review available?",
    a: "Yes. Our Human Review plan pairs AI analysis with a professional mixing engineer who provides a video walkthrough and personalized revision notes.",
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

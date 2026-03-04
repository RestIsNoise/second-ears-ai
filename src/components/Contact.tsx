import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const Contact = () => (
  <section className="py-14 md:py-16 px-6 border-t border-border-subtle">
    <div className="max-w-5xl mx-auto text-center">
      <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
        Get in touch
      </p>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
        Contact
      </h2>
      <p className="text-sm text-muted-foreground mb-1.5">
        Questions, partnerships, or early access requests.
      </p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
        Reach out about billing, technical issues, feedback quality, or feature requests. We read every message.
      </p>
      <Button variant="hero" size="lg" className="h-11 px-8 text-[13px] gap-2" asChild>
        <a href="mailto:hello@secondears.io">
          <Mail className="w-4 h-4" />
          hello@secondears.io
        </a>
      </Button>
      <p className="text-[11px] text-muted-foreground/50 mt-3">
        Response within 24–48h
      </p>
    </div>
  </section>
);

export default Contact;

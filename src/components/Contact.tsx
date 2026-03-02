import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const Contact = () => (
  <section className="py-16 md:py-20 px-6 border-t border-border-subtle">
    <div className="max-w-2xl mx-auto text-center">
      <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">
        Get in touch
      </p>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
        Contact
      </h2>
      <p className="text-sm text-muted-foreground mb-2">
        Questions, partnerships, or early access requests.
      </p>
      <p className="text-sm text-muted-foreground/70 max-w-md mx-auto mb-8 leading-relaxed">
        Reach out about billing, technical issues, feedback quality, or feature requests. We read every message and route it to the right person on our team.
      </p>
      <Button variant="hero" size="lg" className="h-11 px-8 text-[13px] gap-2" asChild>
        <a href="mailto:hello@secondears.io">
          <Mail className="w-4 h-4" />
          hello@secondears.io
        </a>
      </Button>
      <p className="text-[11px] text-muted-foreground/40 mt-4">
        Response within 24–48h
      </p>
    </div>
  </section>
);

export default Contact;

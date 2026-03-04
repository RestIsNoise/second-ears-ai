import { useEffect, useState, useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageShellProps {
  title: string;
  sections: LegalSection[];
  footnote?: string;
}

const LegalPageShell = ({ title, sections, footnote }: LegalPageShellProps) => {
  const allIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14 pb-10 px-4 md:px-6">
        <div className="max-w-[760px] mx-auto">
          {/* Header */}
          <div className="pt-5 md:pt-8 mb-6 md:mb-8">
            <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
              Legal
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: March 2026
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-end gap-3 mb-3">
            <button
              onClick={() => setOpenItems(allIds)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Expand all
            </button>
            <span className="text-muted-foreground/30 text-xs">·</span>
            <button
              onClick={() => setOpenItems([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Collapse all
            </button>
          </div>

          {/* Accordion */}
          <Accordion
            type="multiple"
            value={openItems}
            onValueChange={setOpenItems}
            className="border-t border-border-subtle"
          >
            {sections.map(({ id, title: sectionTitle, content }) => (
              <AccordionItem
                key={id}
                value={id}
                className="border-b border-border-subtle"
              >
                <AccordionTrigger className="py-4 md:py-5 hover:no-underline group">
                  <span className="text-base md:text-lg font-semibold text-foreground tracking-tight text-left group-hover:text-foreground/80 transition-colors">
                    {sectionTitle}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 md:pb-6">
                  {content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {footnote && (
            <p className="text-xs text-muted-foreground/50 mt-6">
              {footnote}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPageShell;

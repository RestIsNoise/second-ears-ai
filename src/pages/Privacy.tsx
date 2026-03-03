import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  { id: "collect", title: "What we collect" },
  { id: "use", title: "How we use data" },
  { id: "audio", title: "Audio files & retention" },
  { id: "third-party", title: "Third-party services" },
  { id: "rights", title: "Your rights" },
  { id: "contact", title: "Contact" },
];

const Privacy = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14 md:pt-14 pb-16 px-6">
        <div className="max-w-[760px] mx-auto relative">
          {/* Header */}
          <div className="pt-8 md:pt-10 mb-10 md:mb-14">
            <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
              Legal
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: March 2026
            </p>
          </div>

          <div className="flex gap-16">
            {/* Desktop TOC */}
            <nav className="hidden lg:block w-44 shrink-0 sticky top-24 self-start">
              <ul className="space-y-2">
                {sections.map(({ id, title }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`block text-[13px] py-1 transition-colors ${
                        activeSection === id
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-10 md:space-y-12">
              {/* Mobile TOC */}
              <nav className="lg:hidden border border-border-subtle rounded-lg p-4">
                <p className="font-mono-brand text-[11px] text-muted-foreground tracking-widest uppercase mb-3">
                  On this page
                </p>
                <ul className="space-y-1.5">
                  {sections.map(({ id, title }) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <section id="collect" className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                  What we collect
                </h2>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                  When you use SecondEars, we collect the audio files you upload, the listening mode you select, and any context text you provide alongside your track. We also collect basic usage data — timestamps, file metadata (name, format, duration), and session identifiers — to operate and improve the service.
                </p>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                  We do not collect personal information beyond what is necessary for authentication and billing (email address, payment details via Stripe).
                </p>
              </section>

              <section id="use" className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                  How we use data
                </h2>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                  Your audio files are processed solely to generate mix feedback. They are not shared with third parties, used for advertising, or included in any AI training datasets. Analysis results are stored so you can access them later from your dashboard.
                </p>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                  Aggregated, anonymous usage metrics (e.g. total analyses run, average file duration) may be used internally to monitor service health and plan capacity. These metrics never contain identifiable information.
                </p>
              </section>

              <section id="audio" className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                  Audio files &amp; retention
                </h2>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                  Uploaded tracks are stored securely and encrypted at rest. You can delete your tracks at any time from your account. Files are retained only as long as needed to deliver your analysis results.
                </p>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                  If you delete your account, all associated data — including uploaded files, analysis results, and personal information — is permanently removed within 30 days. Temporary processing copies are purged immediately after analysis completes.
                </p>
              </section>

              <section id="third-party" className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                  Third-party services
                </h2>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                  SecondEars relies on a small number of infrastructure providers to operate:
                </p>
                <ul className="mt-3 space-y-2 text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground list-disc list-inside">
                  <li>
                    <span className="text-foreground font-medium">Supabase</span> — authentication, database, and file storage
                  </li>
                  <li>
                    <span className="text-foreground font-medium">Railway</span> — backend compute and hosting
                  </li>
                  <li>
                    <span className="text-foreground font-medium">AI providers</span> — audio analysis processing (your files are sent for analysis only, not retained by these providers)
                  </li>
                  <li>
                    <span className="text-foreground font-medium">Stripe</span> — payment processing (we never see or store your full card details)
                  </li>
                </ul>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                  All providers are contractually bound to protect your data and are not permitted to use it for their own purposes. We do not sell or share your personal information.
                </p>
              </section>

              <section id="rights" className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                  Your rights
                </h2>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                  You have the right to access, correct, or delete your personal data at any time. You can also request a full export of your data or ask us to stop processing it entirely.
                </p>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                  We respond to all privacy-related requests within 14 business days. If you're located in the EU, you also have rights under GDPR including data portability and the right to lodge a complaint with a supervisory authority.
                </p>
              </section>

              <section id="contact" className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                  Contact
                </h2>
                <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                  For any privacy-related questions or requests, reach us at{" "}
                  <a
                    href="mailto:hello@secondears.io"
                    className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                  >
                    hello@secondears.io
                  </a>
                  . We take every inquiry seriously and aim to respond promptly.
                </p>
              </section>

              <p className="text-xs text-muted-foreground/50 pt-4">
                This policy may be updated from time to time. Significant changes will be communicated via email.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;

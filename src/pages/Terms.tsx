import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14 md:pt-14 pb-12 px-4 md:px-6">
        <div className="max-w-[760px] mx-auto">
          <div className="pt-5 md:pt-10 mb-10 md:mb-14">
            <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
              Legal
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: March 2026
            </p>
          </div>

          <div className="space-y-10 md:space-y-12">
            <section>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                Service scope
              </h2>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                SecondEars provides AI-powered mix feedback for audio tracks uploaded by registered users. The service analyzes your audio and returns structured, actionable feedback based on the listening mode you select. We do not master, mix, or modify your audio files.
              </p>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice. Feature availability may vary by plan.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                User responsibilities
              </h2>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                You are responsible for the content you upload. By submitting audio, you confirm that you own or have the necessary rights to that material. You agree not to upload content that is illegal, infringing, or harmful.
              </p>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                You are responsible for maintaining the security of your account credentials. Notify us immediately if you suspect unauthorized access to your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                Billing and subscriptions
              </h2>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                Paid plans are billed on a recurring basis (monthly or yearly) through Stripe. You can cancel your subscription at any time — your access continues until the end of the current billing period. No partial refunds are issued for unused time.
              </p>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                We may change pricing with 30 days' notice. Existing subscribers will be notified before any price change takes effect on their next renewal.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                Intellectual property
              </h2>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                You retain full ownership of all audio files you upload. SecondEars does not claim any rights to your content. We do not use your tracks to train AI models or share them with third parties beyond what is required to deliver the analysis.
              </p>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                The SecondEars name, logo, interface design, and generated feedback format are our intellectual property and may not be reproduced without permission.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                Limitation of liability
              </h2>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                SecondEars is provided "as is" without warranties of any kind. We do not guarantee that feedback will be error-free, complete, or suitable for any particular purpose. AI-generated analysis is advisory — final creative decisions remain yours.
              </p>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                To the maximum extent permitted by law, SecondEars' total liability is limited to the amount you paid for the service in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                Termination
              </h2>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                You may close your account at any time. Upon deletion, all your data — including uploaded files and analysis results — will be permanently removed within 30 days.
              </p>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground mt-4">
                We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or compromise the security or integrity of the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                Contact
              </h2>
              <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">
                Questions about these terms? Reach us at{" "}
                <a
                  href="mailto:hello@secondears.io"
                  className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                >
                  hello@secondears.io
                </a>
                .
              </p>
            </section>

            <p className="text-xs text-muted-foreground/50 pt-4">
              These terms may be updated from time to time. Continued use of SecondEars after changes constitutes acceptance.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;

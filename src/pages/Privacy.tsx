import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-28 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">Data we collect</h2>
            <p>When you use SecondEars, we collect the audio files you upload, the listening mode you select, and any context text you provide. We also collect basic usage data such as timestamps, file metadata, and session information to improve the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">How we use your data</h2>
            <p>Your audio files are processed solely to generate mix feedback. They are not shared with third parties, used for advertising, or included in any AI training datasets. Analysis results are stored so you can access them later.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">Storage & retention</h2>
            <p>Uploaded tracks are stored securely and encrypted at rest. You can delete your tracks at any time. If you delete your account, all associated data — including uploaded files, analysis results, and personal information — is permanently removed within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">Third-party services</h2>
            <p>We use infrastructure providers for hosting, storage, and AI processing. These providers are contractually bound to protect your data and are not permitted to use it for their own purposes. We do not sell or share your personal information.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">Cookies & analytics</h2>
            <p>We use minimal, functional cookies to maintain your session. We may use privacy-respecting analytics to understand usage patterns. We do not use tracking pixels, social media trackers, or invasive fingerprinting techniques.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">Your rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. You can also request a copy of your data or ask us to stop processing it. Contact us at hello@secondears.io for any privacy-related requests.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">Changes to this policy</h2>
            <p>We may update this policy from time to time. Significant changes will be communicated via email or a notice on the site. Continued use of SecondEars after changes constitutes acceptance of the updated policy.</p>
          </section>

          <p className="text-xs text-muted-foreground/40 pt-4">
            Last updated: March 2026
          </p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;

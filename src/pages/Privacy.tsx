import LegalPageShell from "@/components/LegalPageShell";

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">{children}</p>
);

const sections = [
  {
    id: "collect",
    title: "What we collect",
    content: (
      <>
        <P>
          When you use SecondEar, we collect the audio files you upload, the listening mode you select, and any context text you provide alongside your track. We also collect basic usage data — timestamps, file metadata (name, format, duration), and session identifiers — to operate and improve the service.
        </P>
        <div className="mt-4">
          <P>
            We do not collect personal information beyond what is necessary for authentication and billing (email address, payment details via Stripe).
          </P>
        </div>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use data",
    content: (
      <>
        <P>
          Your audio files are processed solely to generate mix feedback. They are not shared with third parties, used for advertising, or included in any AI training datasets. Analysis results are stored so you can access them later from your dashboard.
        </P>
        <div className="mt-4">
          <P>
            Aggregated, anonymous usage metrics (e.g. total analyses run, average file duration) may be used internally to monitor service health and plan capacity. These metrics never contain identifiable information.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "audio",
    title: "Audio files & retention",
    content: (
      <>
        <P>
          Uploaded tracks are stored securely and encrypted at rest. You can delete your tracks at any time from your account. Files are retained only as long as needed to deliver your analysis results.
        </P>
        <div className="mt-4">
          <P>
            If you delete your account, all associated data — including uploaded files, analysis results, and personal information — is permanently removed within 30 days. Temporary processing copies are purged immediately after analysis completes.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Third-party processors",
    content: (
      <>
        <P>SecondEar relies on a small number of infrastructure providers to operate:</P>
        <ul className="mt-3 space-y-2 text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground list-disc list-inside">
          <li><span className="text-foreground font-medium">Supabase</span> — authentication, database, and file storage</li>
          <li><span className="text-foreground font-medium">Railway</span> — backend compute and hosting</li>
          <li><span className="text-foreground font-medium">AI providers</span> — audio analysis processing (your files are sent for analysis only, not retained)</li>
          <li><span className="text-foreground font-medium">Stripe</span> — payment processing (we never see or store your full card details)</li>
        </ul>
        <div className="mt-4">
          <P>
            All providers are contractually bound to protect your data and are not permitted to use it for their own purposes. We do not sell or share your personal information.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    content: (
      <>
        <P>
          You have the right to access, correct, or delete your personal data at any time. You can also request a full export of your data or ask us to stop processing it entirely.
        </P>
        <div className="mt-4">
          <P>
            We respond to all privacy-related requests within 14 business days. If you're located in the EU, you also have rights under GDPR including data portability and the right to lodge a complaint with a supervisory authority.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <P>
        For any privacy-related questions or requests, reach us at{" "}
        <a
          href="mailto:hello@secondears.io"
          className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
        >
          hello@secondears.io
        </a>
        .
      </P>
    ),
  },
];

const Privacy = () => (
  <LegalPageShell
    title="Privacy Policy"
    sections={sections}
    footnote="This policy may be updated from time to time. Significant changes will be communicated via email."
  />
);

export default Privacy;

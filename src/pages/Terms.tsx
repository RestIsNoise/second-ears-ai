import LegalPageShell from "@/components/LegalPageShell";

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[15px] md:text-[17px] leading-[1.65] text-muted-foreground">{children}</p>
);

const sections = [
  {
    id: "scope",
    title: "Service scope",
    content: (
      <>
        <P>
          SecondEar provides AI-powered mix feedback for audio tracks uploaded by registered users. The service analyzes your audio and returns structured, actionable feedback based on the listening mode you select. We do not master, mix, or modify your audio files.
        </P>
        <div className="mt-4">
          <P>
            We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice. Feature availability may vary by plan.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "responsibilities",
    title: "User responsibilities",
    content: (
      <>
        <P>
          You are responsible for the content you upload. By submitting audio, you confirm that you own or have the necessary rights to that material. You agree not to upload content that is illegal, infringing, or harmful.
        </P>
        <div className="mt-4">
          <P>
            You are responsible for maintaining the security of your account credentials. Notify us immediately if you suspect unauthorized access to your account.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "billing",
    title: "Billing and subscriptions",
    content: (
      <>
        <P>
          Paid plans are billed on a recurring basis (monthly or yearly) through Stripe. You can cancel your subscription at any time — your access continues until the end of the current billing period. No partial refunds are issued for unused time.
        </P>
        <div className="mt-4">
          <P>
            We may change pricing with 30 days' notice. Existing subscribers will be notified before any price change takes effect on their next renewal.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    content: (
      <>
        <P>
          You retain full ownership of all audio files you upload. SecondEar does not claim any rights to your content. We do not use your tracks to train AI models or share them with third parties beyond what is required to deliver the analysis.
        </P>
        <div className="mt-4">
          <P>
            The SecondEars name, logo, interface design, and generated feedback format are our intellectual property and may not be reproduced without permission.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: (
      <>
        <P>
          SecondEars is provided "as is" without warranties of any kind. We do not guarantee that feedback will be error-free, complete, or suitable for any particular purpose. AI-generated analysis is advisory — final creative decisions remain yours.
        </P>
        <div className="mt-4">
          <P>
            To the maximum extent permitted by law, SecondEars' total liability is limited to the amount you paid for the service in the 12 months preceding the claim.
          </P>
        </div>
      </>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    content: (
      <>
        <P>
          You may close your account at any time. Upon deletion, all your data — including uploaded files and analysis results — will be permanently removed within 30 days.
        </P>
        <div className="mt-4">
          <P>
            We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or compromise the security or integrity of the service.
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
        Questions about these terms? Reach us at{" "}
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

const Terms = () => (
  <LegalPageShell
    title="Terms of Service"
    sections={sections}
    footnote="These terms may be updated from time to time. Continued use of SecondEars after changes constitutes acceptance."
  />
);

export default Terms;

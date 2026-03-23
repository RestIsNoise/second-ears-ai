const SocialProofBar = () => (
  <div
    className="w-full flex items-center justify-center px-6"
    style={{
      padding: "20px 24px",
      borderTop: "1px solid hsl(0 0% 92%)",
      borderBottom: "1px solid hsl(0 0% 92%)",
      background: "hsl(var(--background))",
    }}
  >
    <div className="flex items-center gap-4 w-full max-w-3xl">
      <div className="flex-1 h-px" style={{ background: "hsl(0 0% 88%)" }} />
      <p
        className="shrink-0 text-center"
        style={{
          fontSize: 13,
          color: "hsl(0 0% 60%)",
          fontStyle: "italic",
        }}
      >
        Trusted by producers, mix engineers and beatmakers worldwide.
      </p>
      <div className="flex-1 h-px" style={{ background: "hsl(0 0% 88%)" }} />
    </div>
  </div>
);

export default SocialProofBar;

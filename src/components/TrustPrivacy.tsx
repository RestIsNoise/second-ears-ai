import { Link } from "react-router-dom";

const bullets = [
  "Files are processed securely",
  "You can delete tracks anytime",
  "No public sharing without consent",
  "Clear data retention policy",
];

const TrustPrivacy = () => (
  <section className="py-14 md:py-16 px-6 border-t border-border-subtle">
    <div className="max-w-5xl mx-auto">
      <div className="max-w-2xl">
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
          Trust & privacy
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
          Your audio stays yours
        </h2>
        <ul className="space-y-2.5 mb-6">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-foreground/30 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
        <Link
          to="/privacy"
          className="font-mono-brand text-[11px] text-muted-foreground/50 tracking-wider uppercase hover:text-foreground/60 transition-colors"
        >
          Privacy Policy →
        </Link>
      </div>
    </div>
  </section>
);

export default TrustPrivacy;

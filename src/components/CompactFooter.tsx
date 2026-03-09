const CompactFooter = () => (
  <footer className="py-4 px-6 text-center">
    <p
      className="text-[10px] text-foreground/30 tracking-[0.06em]"
      style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
    >
      © {new Date().getFullYear()} Second Ears · AI mix feedback
    </p>
  </footer>
);

export default CompactFooter;

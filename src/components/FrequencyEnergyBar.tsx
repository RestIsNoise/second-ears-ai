interface FrequencyBand {
  label: string;
  value: number; // 0-1
}

interface Props {
  bands: FrequencyBand[];
  color: string;
  dimColor: string;
}

const MONO = "'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace";

const FrequencyEnergyBar = ({ bands, color, dimColor }: Props) => {
  return (
    <div
      className="flex items-center gap-4 px-3 py-2"
      style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
    >
      {bands.map((band) => (
        <div key={band.label} className="flex items-center gap-2 flex-1">
          <span
            className="uppercase shrink-0"
            style={{
              fontFamily: MONO,
              fontSize: 7,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.35)",
              width: 24,
            }}
          >
            {band.label}
          </span>
          <div
            className="relative flex-1 h-[5px] rounded-sm overflow-hidden"
            style={{ backgroundColor: dimColor }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-sm"
              style={{
                width: `${Math.max(0, Math.min(100, band.value * 100))}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FrequencyEnergyBar;

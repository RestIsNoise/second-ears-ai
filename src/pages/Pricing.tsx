import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import { ShieldCheck, EyeOff, FileAudio } from "lucide-react";

const trustItems = [
  { icon: ShieldCheck, label: "Private by default" },
  { icon: EyeOff, label: "Not used to train AI models" },
  { icon: FileAudio, label: "WAV · MP3 · FLAC supported" },
];

const PricingPage = () => {
  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  return (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-14">
      <Pricing />
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 py-10 px-6">
        {trustItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-[11px] tracking-wide"
            style={{ color: isDark ? "#555" : "#999" }}
          >
            <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: isDark ? "#555" : "#bbb" }} strokeWidth={1.5} />
            {item.label}
          </div>
        ))}
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default PricingPage;

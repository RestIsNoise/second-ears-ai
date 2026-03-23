import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import DemoSection from "@/components/DemoSection";
import SampleFeedback from "@/components/SampleFeedback";
import Proof from "@/components/Proof";
import ListeningModes from "@/components/ListeningModes";
import Pricing from "@/components/Pricing";
import TrustStrip from "@/components/TrustStrip";
import UnifiedFooter from "@/components/UnifiedFooter";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main>
      <Hero />
      <HowItWorks />
      <DemoSection />
      <SampleFeedback />
      <ListeningModes />
      <Proof />
      <Pricing />
      <TrustStrip />
    </main>
    <UnifiedFooter />
  </div>
);

export default Index;

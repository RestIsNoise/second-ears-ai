import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SocialProofBar from "@/components/SocialProofBar";
import HowItWorks from "@/components/HowItWorks";
import DemoSection from "@/components/DemoSection";
import SampleFeedback from "@/components/SampleFeedback";
import Proof from "@/components/Proof";
import ListeningModes from "@/components/ListeningModes";
import Pricing from "@/components/Pricing";
import TrustStrip from "@/components/TrustStrip";
import UnifiedFooter from "@/components/UnifiedFooter";

const Index = () => {
  useEffect(() => { document.title = "SecondEar — AI Mix Feedback for Producers"; }, []);
  return (
  <div className="min-h-screen bg-background">
    <Header />
    <main>
      <Hero />
      <SocialProofBar />
      <HowItWorks />
      <SampleFeedback />
      <ListeningModes />
      <Proof />
      <DemoSection />
      <Pricing />
      <TrustStrip />
    </main>
    <UnifiedFooter />
  </div>
  );
};

export default Index;

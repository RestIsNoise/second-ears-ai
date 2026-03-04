import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import SampleFeedback from "@/components/SampleFeedback";
import Proof from "@/components/Proof";
import ListeningModes from "@/components/ListeningModes";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import FinalCta from "@/components/FinalCta";
import TrustStrip from "@/components/TrustStrip";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main>
      <Hero />
      <HowItWorks />
      <SampleFeedback />
      <Proof />
      <ListeningModes />
      <Pricing />
      <TrustStrip />
      <FinalCta />
      <Contact />
    </main>
    <Footer />
  </div>
);

export default Index;

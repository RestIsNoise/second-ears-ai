import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ValueProps from "@/components/ValueProps";
import DemoVideo from "@/components/DemoVideo";
import ListeningModes from "@/components/ListeningModes";
import Pricing from "@/components/Pricing";
import TrustPrivacy from "@/components/TrustPrivacy";
import Faq from "@/components/Faq";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main>
      <Hero />
      <ValueProps />
      <DemoVideo />
      <ListeningModes />
      <Pricing />
      <TrustPrivacy />
      <Faq />
      <Contact />
    </main>
    <Footer />
  </div>
);

export default Index;

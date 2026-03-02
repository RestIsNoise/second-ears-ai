import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ValueProps from "@/components/ValueProps";
import DemoVideo from "@/components/DemoVideo";
import ListeningModes from "@/components/ListeningModes";
import Pricing from "@/components/Pricing";
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
    </main>
    <Footer />
  </div>
);

export default Index;

import { useEffect } from "react";
import Header from "@/components/Header";
import FaqSection from "@/components/Faq";
import Footer from "@/components/Footer";

const FaqPage = () => {
  useEffect(() => { document.title = "FAQ — SecondEar"; }, []);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14">
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
};

export default FaqPage;

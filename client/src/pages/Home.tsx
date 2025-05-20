import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import WhyItWorks from "@/components/WhyItWorks";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import SuccessModal from "@/components/SuccessModal";
import TrustAndSecurity from "@/components/TrustAndSecurity";
import { trackPageView } from "@/lib/analytics";
import { useEffect } from "react";

export default function Home() {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Track page view when component mounts
  useEffect(() => {
    trackPageView("home");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <Hero onSubscribeSuccess={() => setIsSuccessModalOpen(true)} />
        <HowItWorks />
        <WhyItWorks />
        <TrustAndSecurity />
        <FAQ />
        <FinalCTA onSubscribeSuccess={() => setIsSuccessModalOpen(true)} />
      </main>
      <Footer />
      <SuccessModal 
        isOpen={isSuccessModalOpen} 
        onClose={() => setIsSuccessModalOpen(false)} 
      />
    </div>
  );
}

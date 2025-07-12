import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessModal from "@/components/SuccessModal";
import { trackPageView } from "@/lib/analytics";
import HeroV2 from "@/components/v2/HeroV2";
import HowItWorks from "@/components/HowItWorks";
import TransparentEconomicsV2 from "@/components/v2/TransparentEconomicsV2";
import EarlyAccessV2 from "@/components/v2/EarlyAccessV2";
import HighWinRatesV2 from "@/components/v2/HighWinRatesV2";
import WhatYouLearn from "@/components/WhatYouLearn";
import FAQ from "@/components/FAQ";
import FinalCTAV2 from "@/components/v2/FinalCTAV2";

export default function HomeV2() {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  useEffect(() => {
    trackPageView("home_v2");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <HeroV2 onSubscribeSuccess={() => setIsSuccessModalOpen(true)} />
        <HowItWorks />
        <TransparentEconomicsV2 />
        <EarlyAccessV2 />
        <HighWinRatesV2 />
        <WhatYouLearn />
        <FAQ />
        <FinalCTAV2 onSubscribeSuccess={() => setIsSuccessModalOpen(true)} />
      </main>
      <Footer />
      <SuccessModal 
        isOpen={isSuccessModalOpen} 
        onClose={() => setIsSuccessModalOpen(false)} 
      />
    </div>
  );
}
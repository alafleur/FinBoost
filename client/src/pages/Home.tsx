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
import RewardsExplained from "@/components/RewardsExplained";
import WhatYouLearn from "@/components/WhatYouLearn";
import PowerOfCollective from "@/components/PowerOfCollective";
import HowRewardsWork from "@/components/HowRewardsWork";
import FlywheelGraphic from "@/components/FlywheelGraphic";
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
        {/* 1. Hero Section */}
        <Hero onSubscribeSuccess={() => setIsSuccessModalOpen(true)} />
        
        {/* Financial Growth Flywheel */}
        <section className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8">
              <h2 className="font-heading font-bold text-3xl">The Virtuous Cycle of Financial Growth</h2>
              <p className="text-gray-600 mt-3 max-w-2xl mx-auto">Our platform creates a continuous cycle of learning, earning, and improving your financial well-being</p>
            </div>
            <FlywheelGraphic />
          </div>
        </section>
        
        {/* 2. How It Works */}
        <HowItWorks />
        
        {/* 3. Example Graphic / Pool Teaser */}
        <HowRewardsWork />
        
        {/* 4. Why Join / Value Prop Blocks */}
        <WhyItWorks />
        <WhatYouLearn />
        <PowerOfCollective />
        
        {/* 5. Trust and Security */}
        <TrustAndSecurity />
        
        {/* 6. FAQs */}
        <FAQ />
        
        {/* 7. Join the Waitlist (Repeat CTA) */}
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

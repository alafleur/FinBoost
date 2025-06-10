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
import FlywheelFeatures from "@/components/FlywheelFeatures";
import MembershipValue from "@/components/MembershipValue";
import TrustBanner from "@/components/TrustBanner";
import GrowthCTA from "@/components/GrowthCTA";

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
        
        {/* 2. How It Works */}
        <HowItWorks />
        
        {/* 3. Membership Value Section */}
        <MembershipValue />
        
        {/* 4. The Rewards Pool / Power of the Collective */}
        <HowRewardsWork />
        
        {/* 5. What You'll Learn */}
        <WhatYouLearn />
        
        {/* Mini Trust Banner */}
        <TrustBanner />
        
        {/* 6. Growth Chart + Waitlist CTA */}
        <GrowthCTA onSubscribeSuccess={() => setIsSuccessModalOpen(true)} />
        
        {/* 7. FAQs */}
        <FAQ />
        
        {/* 8. Join the Waitlist (Final CTA) */}
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

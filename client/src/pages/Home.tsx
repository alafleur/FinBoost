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
import { Plus, RefreshCw } from "lucide-react";

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
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">It's a Flywheel That Lifts Everyone</h2>
                <p className="text-gray-600 mb-8">Our platform creates a positive feedback loop where everyone benefits from collective growth.</p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-secondary-500"><Plus className="h-5 w-5" /></span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-heading font-medium text-lg">More members means a larger monthly rewards pool</h3>
                      <p className="text-gray-600 mt-1">The more members who join, the larger the rewards for everyone.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-500"><RefreshCw className="h-5 w-5" /></span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-heading font-medium text-lg">Virtuous cycle of financial growth</h3>
                      <p className="text-gray-600 mt-1">Our flywheel model creates a continuous cycle of improvement.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-center mb-5">
                  <h3 className="font-heading font-semibold text-xl mb-3">The Virtuous Cycle of Financial Growth</h3>
                  <p className="text-gray-600 text-sm">Learn → Earn → Reward → Improve → Repeat</p>
                </div>
                <FlywheelGraphic />
              </div>
            </div>
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

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
            <div className="text-center mb-8">
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">It's a Flywheel That Lifts Everyone</h2>
              <p className="text-gray-600 mx-auto max-w-3xl">Our platform creates a positive feedback loop where everyone benefits from collective growth.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-6">
                  {/* Feature 1 - Learn */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-heading font-medium text-lg">Learn and grow with expert-led content</h3>
                      <p className="text-gray-600 mt-1">Enhance your financial knowledge with interactive lessons and practical exercises.</p>
                    </div>
                  </div>
                  
                  {/* Feature 2 - More members */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-heading font-medium text-lg">More members means a larger monthly rewards pool</h3>
                      <p className="text-gray-600 mt-1">The more members who join, the larger the rewards for everyone.</p>
                    </div>
                  </div>
                  
                  {/* Feature 3 - Merit-based */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-heading font-medium text-lg">Merit-based rewards system for everyone</h3>
                      <p className="text-gray-600 mt-1">The top 50% of members by points are guaranteed monthly cash rewards.</p>
                    </div>
                  </div>
                  
                  {/* Feature 4 - Cash rewards */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-heading font-medium text-lg">Cash rewards reinforce better habits</h3>
                      <p className="text-gray-600 mt-1">Real financial incentives help you stay committed to your money goals.</p>
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

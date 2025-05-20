import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQ() {
  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "How much does membership cost?",
      answer: "$19.99/month. This gives you access to all learning tools, the ability to earn points, and eligibility for monthly cash rewards. Over half of all membership fees go directly back to members through the rewards pool."
    },
    {
      id: "2",
      question: "How much time does it take?",
      answer: "5–20 minutes/week. Most members spend just a few minutes at a time completing bite-sized lessons, taking quizzes, or uploading proof of financial actions. You can participate at your own pace, but more consistent engagement leads to higher point totals."
    },
    {
      id: "3",
      question: "Is this a lottery?",
      answer: "No — rewards are based on a combination of effort (points) and fairness (random draws within each tier). The system is designed to reward both consistency and improvement, with members in all tiers having opportunities to receive rewards."
    },
    {
      id: "4",
      question: "What are Tribe Points?",
      answer: "Points you earn by learning, referring others, and demonstrating responsible financial steps like paying off debt. These points determine which of the three tiers you're placed in each month."
    },
    {
      id: "5",
      question: "How are the rewards distributed?",
      answer: "Every month, 50% of each tier's members are randomly selected to receive rewards. Higher tiers receive bigger shares of the pool: Top Tier = 50%, Middle Tier = 35%, and Bottom Tier = 15%."
    },
    {
      id: "6",
      question: "What if I don't get rewarded one month?",
      answer: "Your points roll over — increasing your tier and chances next month. Consistent participation will help you climb to higher tiers where both your odds and potential reward amounts are greater."
    },
    {
      id: "7",
      question: "What do rewards look like?",
      answer: "Top earners can see hundreds to thousands per month as the collective pool grows. The exact amount depends on your tier, the total membership, and the growing rewards pool."
    },
    {
      id: "8",
      question: "How do I earn points?",
      answer: "Points are earned through four main activities: completing financial lessons, taking knowledge quizzes, referring new members, and uploading proof of positive financial actions (like paying down debt, increasing savings, or investing). Each activity earns different point values."
    },
    {
      id: "9",
      question: "Is my data safe?",
      answer: "Yes. We never sell your data and use industry-standard encryption to protect all personal information. Any financial documents you share for proof of progress are only used to verify your achievements and calculate rewards. Our reward system is transparent and publicly verifiable."
    },
    {
      id: "10",
      question: "When does the platform launch?",
      answer: "We're planning to launch soon. Waitlist members will receive early access invitations in waves, with priority given to those who joined earliest. The sooner you join the waitlist, the earlier you can help grow the rewards pool and your financial future."
    }
  ];

  return (
    <section className="py-20 px-4 bg-white" id="faq">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600">Everything you need to know about our financial learning platform</p>
        </div>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq) => (
            <AccordionItem 
              key={faq.id} 
              value={faq.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="p-6 text-left focus:outline-none bg-gray-50 hover:bg-gray-100 font-heading font-medium text-lg">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="p-6 bg-white text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

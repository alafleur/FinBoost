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
      question: "How are rewards determined?",
      answer: "The top 50% of members by points earn monthly rewards. Points are earned through completing lessons, taking quizzes, referring friends, and uploading proof of financial actions like debt payoff or investing. The higher your points total, the larger your reward tier."
    },
    {
      id: "4",
      question: "How do I earn points?",
      answer: "Points are earned through four main activities: completing financial lessons, taking knowledge quizzes, referring new members, and uploading proof of positive financial actions (like paying down debt, increasing savings, or investing). Each activity earns different point values."
    },
    {
      id: "5",
      question: "What happens to my membership fee?",
      answer: "More than half of your monthly $19.99 membership fee goes directly into the community rewards pool. This creates a growing pot of money that gets distributed to members each month based on their learning progress and participation. The remainder covers platform operations."
    },
    {
      id: "6",
      question: "Is my data safe?",
      answer: "Yes. We never sell your data and use industry-standard encryption to protect all personal information. Any financial documents you share for proof of progress are only used to verify your achievements and calculate rewards. Our reward system is transparent and publicly verifiable."
    },
    {
      id: "7",
      question: "What counts as proof of progress?",
      answer: "Proof of progress includes documentation of debt reduction, savings increases, investment contributions, credit score improvements, or other financial milestones. We accept screenshots of accounts (with sensitive information removed), statements, or other verifiable evidence."
    },
    {
      id: "8",
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

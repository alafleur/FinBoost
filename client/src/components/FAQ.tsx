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
      question: "How do rewards work?",
      answer: "Rewards are distributed monthly based on your activity level and learning progress. The more financial lessons you complete and the higher your quiz scores, the more points you earn. The top 50% of members based on points receive cash rewards, distributed by tier. All rewards come directly from the collective membership pool."
    },
    {
      id: "2",
      question: "What happens to my membership fee?",
      answer: "The majority of your monthly $19.99 membership fee goes directly into the community rewards pool. This creates a growing pot of money that gets distributed to members each month based on their learning progress and participation. A small percentage covers essential platform operations."
    },
    {
      id: "3",
      question: "Is this a lottery?",
      answer: "No, this is not a lottery or game of chance. Rewards are merit-based and directly tied to your learning efforts and financial progress. The more you learn and apply financial knowledge, the more points you earn to qualify for rewards. Everyone has a fair opportunity to earn rewards through active participation."
    },
    {
      id: "4",
      question: "What counts as proof of progress?",
      answer: "Proof of progress includes documentation of debt reduction, savings increases, investment growth, credit score improvements, or other financial milestones. We accept screenshots of accounts (with sensitive information removed), statements, or other verifiable evidence. All submissions are kept confidential and reviewed by our team."
    },
    {
      id: "5",
      question: "How much time do I need to commit?",
      answer: "Most members spend between 5-20 minutes per week engaging with the platform. This includes completing lessons, taking quizzes, and uploading progress documents. You can participate at your own pace, but more consistent engagement leads to higher point totals and better reward opportunities."
    },
    {
      id: "6",
      question: "Is my financial data secure?",
      answer: "Your financial data is secure and never sold. We use bank-level encryption for all sensitive information. Any financial documents you share for proof of progress are only used to verify your achievements and calculate rewards. Your rewards are transparently calculated based on your point totals."
    },
    {
      id: "7",
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

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
      answer: "Rewards are distributed monthly based on your activity level and learning progress. The more financial lessons you complete and the higher your quiz scores, the greater your chance of winning. Top performers are guaranteed rewards, while others have weighted chances based on participation. All rewards come directly from the collective membership pool."
    },
    {
      id: "2",
      question: "What happens to my subscription fee?",
      answer: "100% of your monthly $5 membership fee goes directly into the community rewards pool. This creates a growing pot of money that gets distributed to members each month based on their learning progress and participation. A small percentage covers essential platform operations."
    },
    {
      id: "3",
      question: "Is this a lottery?",
      answer: "No, this is not a lottery or game of chance. Rewards are merit-based and directly tied to your learning efforts and financial progress. The more you learn and apply financial knowledge, the greater your chance of earning rewards. Everyone can improve their odds through active participation."
    },
    {
      id: "4",
      question: "What counts as proof of progress?",
      answer: "Proof of progress includes documentation of debt reduction, savings increases, investment growth, credit score improvements, or other financial milestones. We accept screenshots of accounts (with sensitive information removed), statements, or other verifiable evidence. All submissions are kept confidential and reviewed by our team."
    },
    {
      id: "5",
      question: "When does the platform launch?",
      answer: "We're planning to launch in Q3 2023. Waitlist members will receive early access invitations in waves, with priority given to those who joined earliest. We'll send email updates as we get closer to launch with more specific dates and details."
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

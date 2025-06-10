
import { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQ() {
  const [selectedFAQ, setSelectedFAQ] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "How much does membership cost?",
      answer: "$20/month. This gives you access to all learning tools, the ability to earn points, and eligibility for monthly cash rewards. Over half of all membership fees go directly back to members through the rewards pool."
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
      question: "What are points?",
      answer: "Points you earn by learning, referring others, and demonstrating responsible financial steps like paying off debt. These points determine which of the three tiers you're placed in each month."
    },
    {
      id: "5",
      question: "How are rewards distributed?",
      answer: "Every month, 50% of each tier's members are randomly selected to receive rewards. Higher tiers receive bigger shares of the pool: Top Tier = 50%, Middle Tier = 35%, and Bottom Tier = 15%."
    },
    {
      id: "6",
      question: "What if I don't get rewarded?",
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
      question: "When does it launch?",
      answer: "We're planning to launch soon. Waitlist members will receive early access invitations in waves, with priority given to those who joined earliest. The sooner you join the waitlist, the earlier you can help grow the rewards pool and your financial future."
    },
    {
      id: "11",
      question: "What is FinBoost?",
      answer: "FinBoost is a learn-to-earn platform where members complete financial education lessons to earn points and qualify for monthly cash rewards. The more you learn, the better your odds of winning from our community-funded reward pool."
    },
    {
      id: "12",
      question: "How do we make money?",
      answer: "FinBoost operates on a membership model. A portion of membership fees funds the monthly reward pools, while the remainder covers platform operations and content development. This creates a sustainable ecosystem where everyone benefits from collective learning."
    }
  ];

  const toggleFAQ = (id: string) => {
    setSelectedFAQ(selectedFAQ === id ? null : id);
  };

  return (
    <section className="py-20 px-4 bg-white" id="faq">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600">Everything you need to know about our financial learning platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faqs.map((faq) => (
            <div 
              key={faq.id}
              className={`relative border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary-500 hover:shadow-md ${
                selectedFAQ === faq.id ? 'border-primary-500 bg-primary-50' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => toggleFAQ(faq.id)}
            >
              <div className="flex items-start justify-between">
                <h4 className="font-heading font-medium text-sm leading-tight pr-2">{faq.question}</h4>
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center transition-all duration-200 ${
                  selectedFAQ === faq.id ? 'border-primary-500 bg-primary-500' : ''
                }`}>
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    selectedFAQ === faq.id ? 'bg-white' : ''
                  }`} />
                </div>
              </div>
              
              {selectedFAQ === faq.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

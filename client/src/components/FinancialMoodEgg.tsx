import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Heart, TrendingUp, Clock, X, ThumbsUp } from "lucide-react";

interface FinancialMoodData {
  emoji: React.ReactNode;
  text: string;
  color: string;
}

export default function FinancialMoodEgg() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMood, setCurrentMood] = useState<FinancialMoodData | null>(null);

  const financialMoods: FinancialMoodData[] = [
    {
      emoji: <DollarSign className="h-6 w-6" />,
      text: "Feeling a little richer today!",
      color: "bg-green-500"
    },
    {
      emoji: <Heart className="h-6 w-6" />,
      text: "Financial self-care is important",
      color: "bg-pink-500"
    },
    {
      emoji: <TrendingUp className="h-6 w-6" />,
      text: "Today's a good day to grow your wealth",
      color: "bg-blue-500"
    },
    {
      emoji: <Clock className="h-6 w-6" />,
      text: "Time to check in on your money goals",
      color: "bg-purple-500"
    },
    {
      emoji: <ThumbsUp className="h-6 w-6" />,
      text: "You're doing great with your finances!",
      color: "bg-amber-500"
    }
  ];

  // Function to show a random mood
  const showRandomMood = () => {
    const randomIndex = Math.floor(Math.random() * financialMoods.length);
    setCurrentMood(financialMoods[randomIndex]);
    setIsVisible(true);

    // Hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  useEffect(() => {
    // Show the Easter egg at random intervals
    const showEasterEgg = () => {
      // Random time between 15 seconds and 30 seconds
      const randomTime = Math.floor(Math.random() * (30000 - 15000) + 15000);
      
      const timer = setTimeout(() => {
        showRandomMood();
        // Set up the next appearance
        showEasterEgg();
      }, randomTime);
      
      // Cleanup to prevent memory leaks
      return () => clearTimeout(timer);
    };
    
    // Show immediately after 3 seconds for first appearance
    const initialTimer = setTimeout(() => {
      showRandomMood();
      // Then start the random interval appearances
      showEasterEgg();
    }, 3000);
    
    return () => clearTimeout(initialTimer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && currentMood && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed bottom-10 right-5 z-50 ${currentMood.color} text-white p-4 rounded-xl shadow-lg flex items-center gap-3 max-w-xs`}
        >
          <div className="bg-white/20 p-2 rounded-full">
            {currentMood.emoji}
          </div>
          <p className="flex-1 text-sm font-medium">{currentMood.text}</p>
          <button 
            onClick={() => setIsVisible(false)}
            className="bg-white/20 p-1 rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
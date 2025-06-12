import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { BarChart2 } from "lucide-react";
import { useLocation } from "wouter";

export default function QuizDialog() {
  const [, navigate] = useLocation();

  const handleTakeAssessment = () => {
    trackEvent("cta_click", "take_assessment_button");
    navigate("/auth?mode=signup");
  };

  return (
    <Button 
      variant="outline"
      onClick={handleTakeAssessment}
      className="border-primary-500 bg-white text-primary-600 hover:bg-primary-50 font-medium flex items-center px-4 py-2 rounded-lg"
    >
      <BarChart2 className="h-4 w-4 mr-2" />
      Take the Financial Personality Assessment
    </Button>
  );
}
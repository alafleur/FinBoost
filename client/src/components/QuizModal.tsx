import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FinancialQuiz from "./FinancialQuiz";
import { useState } from "react";

interface QuizModalProps {
  triggerElement?: React.ReactNode;
  buttonText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  buttonSize?: "default" | "sm" | "lg" | "icon" | null | undefined;
  buttonClassName?: string;
}

export default function QuizModal({
  triggerElement,
  buttonText = "Take Financial Quiz",
  buttonVariant = "outline",
  buttonSize = "default",
  buttonClassName,
}: QuizModalProps) {
  const [open, setOpen] = useState(false);
  
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerElement || (
          <Button 
            variant={buttonVariant} 
            size={buttonSize}
            className={buttonClassName}
          >
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0">
        <FinancialQuiz />
      </DialogContent>
    </Dialog>
  );
}
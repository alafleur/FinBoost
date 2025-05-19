import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-100 text-green-500">
            <CheckCircle className="h-10 w-10" />
          </div>
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-2xl mb-2">
              You're on the List!
            </DialogTitle>
            <DialogDescription className="text-gray-600 mb-6">
              Thank you for joining our waitlist. We'll notify you when we're ready to launch.
            </DialogDescription>
          </DialogHeader>
          <Button 
            onClick={onClose}
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition duration-300 w-full"
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

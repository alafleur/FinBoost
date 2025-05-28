import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

export default function Navbar() {
  const scrollToForm = () => {
    const heroForm = document.querySelector("#waitlist-signup-form");
    if (heroForm) {
      heroForm.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      // Fallback: scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  
  return (
    <nav className="bg-white shadow-sm px-4 py-4 fixed w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-8 w-8 text-primary-600" />
          <span className="font-heading font-bold text-xl text-dark-800">FinBoost</span>
        </div>
        <div className="flex items-center space-x-3">
          <a 
            href="/auth" 
            className="text-gray-600 hover:text-gray-800 text-sm font-medium transition duration-200"
          >
            Member Login
          </a>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition duration-300 border-2 border-blue-600"
            onClick={scrollToForm}
          >
            Join Waitlist
          </Button>
        </div>
      </div>
    </nav>
  );
}

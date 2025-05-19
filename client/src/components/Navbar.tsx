import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

export default function Navbar() {
  const scrollToForm = () => {
    const heroForm = document.querySelector("#hero-form");
    if (heroForm) {
      heroForm.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  return (
    <nav className="bg-white shadow-sm px-4 py-4 fixed w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-8 w-8 text-primary-600" />
          <span className="font-heading font-bold text-xl text-dark-800">FinBoost</span>
        </div>
        <Button 
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition duration-300 hidden sm:block"
          onClick={scrollToForm}
        >
          Join Waitlist
        </Button>
      </div>
    </nav>
  );
}

import { Button } from "@/components/ui/button";
import { FinBoostLogo } from "@/components/ui/finboost-logo";

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
    <nav className="bg-white shadow-sm px-4 py-5 md:py-4 fixed w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <FinBoostLogo size="md" className="md:scale-110" />
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <a 
            href="/auth" 
            className="text-gray-600 hover:text-gray-800 text-xs md:text-sm font-medium transition duration-200 whitespace-nowrap"
          >
            Member Login
          </a>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 md:px-6 text-xs md:text-sm rounded-lg shadow-md transition duration-300 border-2 border-blue-600"
            onClick={scrollToForm}
          >
            Sign Up for Free
          </Button>
        </div>
      </div>
    </nav>
  );
}

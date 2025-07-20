import { Button } from "@/components/ui/button";
import { FinBoostLogo } from "@/components/ui/finboost-logo";
import { useLocation } from "wouter";

export default function Navbar() {
  const [, navigate] = useLocation();

  const handleSignUpClick = () => {
    navigate("/auth?mode=signup");
  };
  
  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm px-4 py-5 md:py-4 fixed w-full z-50 border-b border-slate-200/20">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <FinBoostLogo size="md" className="md:scale-110" />
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <a 
            href="/auth" 
            className="text-gray-600 hover:text-gray-800 text-xs md:text-sm font-medium transition duration-200 text-center leading-tight"
          >
            <div className="flex flex-col">
              <span>Member</span>
              <span>Login</span>
            </div>
          </a>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 md:px-6 text-xs md:text-sm rounded-lg shadow-md transition duration-300 border-2 border-blue-600"
            onClick={handleSignUpClick}
          >
            Sign Up for Free
          </Button>
        </div>
      </div>
    </nav>
  );
}

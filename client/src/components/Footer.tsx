import { FinBoostLogo } from "@/components/ui/finboost-logo";
import { FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <FinBoostLogo size="lg" />
            </div>
            <p className="mb-4">Financial education that rewards your progress</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-accent-light transition-colors duration-200">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent-light transition-colors duration-200">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent-light transition-colors duration-200">
                <FaInstagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-accent-light transition-colors duration-200">How it Works</a></li>
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Features</a></li>
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Rewards</a></li>
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Testimonials</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">About Us</a></li>
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Blog</a></li>
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Careers</a></li>
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Terms of Service</a></li>
              <li><a href="#" className="hover:text-accent-light transition-colors duration-200">Cookies Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-6 text-sm text-center">
          <p>© {new Date().getFullYear()} FinBoost. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
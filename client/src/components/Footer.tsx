import { FinBoostLogo } from "@/components/ui/finboost-logo";
import { FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand + Social */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <FinBoostLogo size="lg" />
            </div>
            <p className="mb-4 text-sm leading-relaxed">Financial education that rewards your progress</p>
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
          
          {/* Page Sections */}
          <div className="md:col-span-1">
            <h3 className="font-heading font-semibold text-white mb-4">Platform Overview</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#preview" className="hover:text-accent-light transition-colors duration-200">Learn-to-Earn</a></li>
              <li><a href="#learn" className="hover:text-accent-light transition-colors duration-200">Financial Education</a></li>
              <li><a href="#trust" className="hover:text-accent-light transition-colors duration-200">Why FinBoost</a></li>
              <li><a href="#membership" className="hover:text-accent-light transition-colors duration-200">Membership Value</a></li>
              <li><a href="#pool-mechanics" className="hover:text-accent-light transition-colors duration-200">Strength in Numbers</a></li>
              <li><a href="#tiers" className="hover:text-accent-light transition-colors duration-200">Rewards System</a></li>
              <li><a href="#faq" className="hover:text-accent-light transition-colors duration-200">FAQ</a></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="md:col-span-1">
            <h3 className="font-heading font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/terms" className="hover:text-accent-light transition-colors duration-200">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-6 text-sm text-center">
          <p>© {new Date().getFullYear()} FinBoost Technologies Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
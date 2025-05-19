import { DollarSign } from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-dark-800 text-gray-400 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="h-8 w-8 text-primary-400" />
              <span className="font-heading font-bold text-xl text-white">FinBoost</span>
            </div>
            <p className="mb-4">Financial education that rewards your progress</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaInstagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-white">How it Works</a></li>
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Rewards</a></li>
              <li><a href="#" className="hover:text-white">Testimonials</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Cookies Policy</a></li>
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

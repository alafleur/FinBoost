import { LockIcon, ShieldCheck, Eye } from "lucide-react";

export default function TrustAndSecurity() {
  return (
    <section className="py-16 px-4 bg-gray-50" id="trust-security">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Secure & Transparent</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We prioritize your privacy, security, and fairness in everything we do
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <LockIcon className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">Data Privacy</h3>
            <p className="text-gray-600">
              Your financial data stays private. We use bank-level encryption and never sell your personal information to third parties.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Eye className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">Transparent Rewards</h3>
            <p className="text-gray-600">
              Our reward system is transparent and publicly verifiable. You can always see how points are calculated and rewards are distributed.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-accent-600" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">You're In Control</h3>
            <p className="text-gray-600">
              You control what financial data you share and how you participate. We give you the tools, but you decide your level of engagement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
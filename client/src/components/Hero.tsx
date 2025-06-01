import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubscribe } from "@/hooks/use-subscribe";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import QuizDialog from "@/components/QuizDialog";
import { BarChart2 } from "lucide-react";

interface HeroProps {
  onSubscribeSuccess: () => void;
}

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type SubscribeFormValues = z.infer<typeof subscribeSchema>;

export default function Hero({ onSubscribeSuccess }: HeroProps) {
  const { mutate: subscribe, isPending } = useSubscribe();
  const [memberCount] = useState("5,000+");

  const form = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: SubscribeFormValues) => {
    trackEvent("subscribe_attempt", "hero_section");
    subscribe(
      { email: values.email },
      {
        onSuccess: () => {
          trackEvent("subscribe_success", "hero_section");
          onSubscribeSuccess();
          form.reset();
        },
      }
    );
  };

  return (
    <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              Turn Financial Stress into Financial Progress <span className="gradient-text">– Together</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-lg">
              Earn monthly cash rewards while leveling up your money smarts—with the power of the collective behind you.
            </p>
            <div className="max-w-lg" id="waitlist-signup-form">
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-300 focus:border-primary-500 focus:outline-none"
                    value={form.watch("email")}
                    onChange={(e) => form.setValue("email", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button 
                    type="button" 
                    disabled={isPending}
                    onClick={form.handleSubmit(onSubmit)}
                    className="w-full h-[50px] bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 rounded-lg shadow-md transition duration-300 border border-blue-700 whitespace-nowrap text-sm sm:text-base flex items-center justify-center"
                  >
                    {isPending ? "Joining..." : "Join the Waitlist"}
                  </button>
                </div>
              </div>

            </div>
            <p className="text-gray-500 text-sm mt-3">Join {memberCount} members already on the waitlist</p>
          </div>
          <div className="relative">
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <BarChart2 className="h-10 w-10 text-white" />
                </div>
              </div>

              <h3 className="font-heading font-semibold text-xl mb-4 text-center">Financial Progress Made Simple</h3>

              <ul className="space-y-4 mt-6">
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Learn essential financial skills</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Take action and earn points</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Receive cash rewards monthly</p>
                </li>
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600">Join a community that grows together</p>
                <p className="text-primary-600 font-medium mt-2">The more we learn, the more we earn</p>
                <div className="mt-4 flex justify-center">
                  <div className="transform hover:scale-105 transition-transform">
                    <QuizDialog />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
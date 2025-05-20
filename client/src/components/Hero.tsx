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

interface HeroProps {
  onSubscribeSuccess: () => void;
}

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type SubscribeFormValues = z.infer<typeof subscribeSchema>;

export default function Hero({ onSubscribeSuccess }: HeroProps) {
  const { mutate: subscribe, isPending } = useSubscribe();
  const [memberCount] = useState("2,500+");
  
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
              Turn Financial Stress Into Financial Progress — <span className="gradient-text">Together</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-lg">
              Join a collective of members working to improve their financial lives. Learn, take action, and earn points. Each month, half of members are rewarded from a growing pool of cash bonuses — no matter your starting point.
            </p>
            <div className="max-w-lg">
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
                    className="w-full h-[50px] bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 rounded-lg shadow-md transition duration-300 border border-blue-700 whitespace-nowrap text-sm sm:text-base"
                  >
                    {isPending ? "Joining..." : "Join Waitlist"}
                  </button>
                </div>
              </div>
              <div className="mt-4 flex justify-center sm:justify-start">
                <QuizDialog />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-3">Join {memberCount} members already on the waitlist</p>
            <p className="text-gray-600 text-sm mt-2">Membership is $19.99/month. More than half of all membership fees go directly back to the community as monthly rewards.</p>
            <p className="text-gray-600 text-sm mt-1">We never sell your data. Payouts are transparent and secure.</p>
          </div>
          <div className="relative">
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
              <h3 className="font-heading font-semibold text-lg mb-6 text-center">More Members = Bigger Monthly Rewards</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>1,000 Members</span>
                    <span className="font-medium">$10,000 Pool</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                    <div className="reward-pool" style={{ width: "20%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>5,000 Members</span>
                    <span className="font-medium">$50,000 Pool</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                    <div className="reward-pool" style={{ width: "50%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>10,000 Members</span>
                    <span className="font-medium">$100,000 Pool</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                    <div className="reward-pool" style={{ width: "75%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>25,000+ Members</span>
                    <span className="font-medium">$250,000+ Pool</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                    <div className="reward-pool" style={{ width: "100%" }}></div>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center text-sm text-gray-500">
                <p>The more members join, the larger the monthly rewards pool becomes</p>
                <p className="mt-2 text-xs font-medium text-gray-600">Based on $19.99 monthly membership fee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

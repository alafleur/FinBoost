import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubscribe } from "@/hooks/use-subscribe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import MembershipGrowthChart from "./MembershipGrowthChart";

interface GrowthCTAProps {
  onSubscribeSuccess: () => void;
}

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type SubscribeFormValues = z.infer<typeof subscribeSchema>;

export default function GrowthCTA({ onSubscribeSuccess }: GrowthCTAProps) {
  const { mutate: subscribe, isPending } = useSubscribe();
  const [memberCount] = useState("5,000+");

  const form = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: SubscribeFormValues) => {
    trackEvent("subscribe_attempt", "growth_cta_section");
    subscribe(
      { email: values.email },
      {
        onSuccess: () => {
          trackEvent("subscribe_success", "growth_cta_section");
          onSubscribeSuccess();
          form.reset();
        },
      }
    );
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto max-w-5xl">
        {/* Growth Chart */}
        <MembershipGrowthChart />
        
        {/* CTA Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
          <h3 className="font-heading font-bold text-2xl md:text-3xl mb-4 text-gray-800">
            Join the Growing Community
          </h3>
          <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
            The earlier you join, the more you benefit from our collective growth. 
            Be part of building something bigger than yourself.
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-300 focus:border-primary-500 focus:outline-none"
                value={form.watch("email")}
                onChange={(e) => form.setValue("email", e.target.value)}
              />
              <Button 
                type="button" 
                disabled={isPending}
                onClick={form.handleSubmit(onSubmit)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition duration-300 whitespace-nowrap"
              >
                {isPending ? "Joining..." : "Join Waitlist"}
              </Button>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm mt-4">
            Join {memberCount} members already building the future of financial rewards
          </p>
        </div>
      </div>
    </section>
  );
}
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubscribe } from "@/hooks/use-subscribe";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

interface FinalCTAProps {
  onSubscribeSuccess: () => void;
}

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type SubscribeFormValues = z.infer<typeof subscribeSchema>;

export default function FinalCTA({ onSubscribeSuccess }: FinalCTAProps) {
  const { mutate: subscribe, isPending } = useSubscribe();
  
  const form = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: SubscribeFormValues) => {
    trackEvent("subscribe_attempt", "final_cta");
    subscribe(
      { email: values.email },
      {
        onSuccess: () => {
          trackEvent("subscribe_success", "final_cta");
          onSubscribeSuccess();
          form.reset();
        },
      }
    );
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">Your Financial Progress Starts Here</h2>
        <p className="text-white/90 text-xl mb-4 max-w-2xl mx-auto font-medium">
          Get smarter with money. Get rewarded. Sign up today and be part of the first payout cycle.
        </p>
        <p className="text-white/80 text-base mb-8 max-w-2xl mx-auto">
          Join the movement now and help build a community that learns and earns together.
        </p>
        
        <div className="max-w-lg mx-auto mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
            <div className="sm:col-span-5">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full h-[50px] px-4 py-3 rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:outline-none"
                value={form.watch("email")}
                onChange={(e) => form.setValue("email", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <button 
                type="button" 
                disabled={isPending}
                onClick={form.handleSubmit(onSubmit)}
                className="w-full h-[50px] bg-green-500 text-white font-medium px-3 rounded-lg shadow-lg hover:bg-green-600 transition duration-300 whitespace-nowrap text-sm sm:text-base border border-green-600"
              >
                {isPending ? "Processing..." : "Join the Movement"}
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-white/60 text-sm">We'll never share your email. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}

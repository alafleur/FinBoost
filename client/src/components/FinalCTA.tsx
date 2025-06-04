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
    <section className="py-20 px-4 bg-gradient-to-br from-blue-500/90 via-purple-500/85 to-indigo-600/90 text-white" id="final-cta">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
          Ready to Turn Learning Into Earning?
        </h2>
        <p className="text-xl text-blue-100 mb-8 leading-relaxed">
          Join thousands of members who are building wealth through knowledge and earning real rewards.
        </p>
        <button className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-2xl transition duration-300 transform hover:scale-105 border border-blue-400">
          Join the Waitlist Today
        </button>
        <p className="text-sm text-blue-200 mt-4">
          100% free to join • No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
}
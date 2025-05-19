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
    <section className="py-20 px-4 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">Your Financial Progress Starts Here</h2>
        <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
          Join the waitlist and be part of a growing movement to take back financial control — together.
        </p>
        
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-8"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="px-4 py-3 rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:outline-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-white text-primary-600 font-medium px-8 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 whitespace-nowrap"
            >
              {isPending ? "Processing..." : "Get Early Access"}
            </Button>
          </form>
        </Form>
        
        <p className="text-white/60 text-sm">We'll never share your email. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}

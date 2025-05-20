import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubscribe } from "@/hooks/use-subscribe";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

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
              Win Cash Rewards for <span className="gradient-text">Getting Smarter</span> with Money
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-lg">
              Join a collective of financially motivated members where the more you learn, the better your odds of winning monthly cash bonuses — all funded by the power of the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Form {...form}>
                <form 
                  id="hero-form"
                  onSubmit={form.handleSubmit(onSubmit)} 
                  className="w-full flex flex-col sm:flex-row gap-2"
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
                            className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-300 focus:border-primary-500 focus:outline-none"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition duration-300 whitespace-nowrap"
                  >
                    {isPending ? "Joining..." : "Join the Waitlist"}
                  </Button>
                </form>
              </Form>
            </div>
            <p className="text-gray-500 text-sm mt-3">Join {memberCount} members already on the waitlist</p>
          </div>
          <div className="relative">
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
              <h3 className="font-heading font-semibold text-lg mb-6 text-center">More Members = Bigger Monthly Rewards</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>1,000 Members</span>
                    <span className="font-medium">$5,000 Pool</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                    <div className="reward-pool" style={{ width: "20%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>5,000 Members</span>
                    <span className="font-medium">$25,000 Pool</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                    <div className="reward-pool" style={{ width: "50%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>10,000 Members</span>
                    <span className="font-medium">$50,000 Pool</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                    <div className="reward-pool" style={{ width: "75%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>25,000+ Members</span>
                    <span className="font-medium">$125,000+ Pool</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                    <div className="reward-pool" style={{ width: "100%" }}></div>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center text-sm text-gray-500">
                <p>The more members join, the larger the monthly rewards pool becomes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

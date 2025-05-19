import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { SubscribeRequest, SubscribeResponse } from "@/types/subscription";
import { useToast } from "@/hooks/use-toast";

export function useSubscribe() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SubscribeRequest): Promise<SubscribeResponse> => {
      const response = await apiRequest("POST", "/api/subscribe", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscribers'] });
    },
    onError: (error) => {
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Step 3: Winner Status Hook - Comprehensive winner celebration banner management
// Handles winner status fetching, notification dismissal, and real-time updates

export interface WinnerStatus {
  isWinner: boolean;
  cycleId?: number;
  cycleName?: string;
  rewardAmount?: number;
  tier?: string;
  notificationDisplayed: boolean;
  payoutStatus?: string;
  // Step 3: Community stats for non-winners
  communityStats?: {
    totalDistributed: number;
    totalWinners: number;
    currentCycleName?: string;
  };
}

export interface WinnerStatusResponse {
  success: boolean;
  winner: WinnerStatus;
}

export interface DismissNotificationRequest {
  cycleId: number;
}

export interface DismissNotificationResponse {
  success: boolean;
  message: string;
}

// Hook for fetching user winner status with automatic refresh
export function useWinnerStatus() {
  const { toast } = useToast();

  const queryResult = useQuery<WinnerStatusResponse>({
    queryKey: ['/api/user/winner-status'],
    staleTime: 2 * 60 * 1000, // 2 minutes cache - fresher than default for winner notifications
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 2; // Retry up to 2 times for other errors
    },
    retryDelay: 1000, // 1 second retry delay
    refetchOnWindowFocus: true, // Refresh when window gains focus for real-time winner updates
  });

  // Handle errors separately to avoid onError deprecation
  if (queryResult.error && !(queryResult.error instanceof Error && queryResult.error.message.includes('401'))) {
    console.error('Error fetching winner status:', queryResult.error);
  }

  return queryResult;
}

// Hook for dismissing winner notification banners
export function useDismissWinnerNotification() {
  const { toast } = useToast();

  return useMutation<DismissNotificationResponse, Error, DismissNotificationRequest>({
    mutationFn: async (data: DismissNotificationRequest): Promise<DismissNotificationResponse> => {
      const response = await apiRequest("POST", "/api/user/winner-notification/dismiss", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Immediately invalidate and refetch winner status to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/user/winner-status'] });
      
      // Optional: Show success feedback (can be removed if too noisy)
      console.log(`Winner notification dismissed for cycle ${variables.cycleId}`);
    },
    onError: (error, variables) => {
      console.error('Error dismissing winner notification:', error);
      toast({
        title: "Error Dismissing Notification",
        description: `Failed to dismiss winner notification for cycle ${variables.cycleId}. Please try again.`,
        variant: "destructive",
      });
    },
    retry: 1, // Retry once for network failures
    retryDelay: 500 // 500ms retry delay
  });
}

// Utility hook combining winner status and dismissal functionality
export function useWinnerCelebration() {
  const winnerStatusQuery = useWinnerStatus();
  const dismissNotificationMutation = useDismissWinnerNotification();

  // Step 3: Enhanced helper function to check if celebration should be shown for both winners and non-winners
  const shouldShowCelebration = (): boolean => {
    const data = winnerStatusQuery.data as WinnerStatusResponse | undefined;
    const winner = data?.winner;
    return Boolean(
      winner && 
      !winner.notificationDisplayed && 
      winner.cycleId &&
      (winner.isWinner || winner.communityStats) // Show for winners OR non-winners with community stats
    );
  };

  // Helper function to dismiss notification with proper error handling
  const dismissCelebration = (cycleId?: number) => {
    if (!cycleId) {
      console.warn('Cannot dismiss celebration: cycleId is required');
      return;
    }
    
    dismissNotificationMutation.mutate({ cycleId });
  };

  // Combined loading state for UI components
  const isLoading = winnerStatusQuery.isLoading || dismissNotificationMutation.isPending;

  const data = winnerStatusQuery.data as WinnerStatusResponse | undefined;

  return {
    // Query data and states
    winnerStatus: data?.winner,
    isLoadingStatus: winnerStatusQuery.isLoading,
    statusError: winnerStatusQuery.error,
    
    // Mutation states
    isDismissing: dismissNotificationMutation.isPending,
    dismissError: dismissNotificationMutation.error,
    
    // Combined states
    isLoading,
    
    // Helper functions
    shouldShowCelebration,
    dismissCelebration,
    
    // Direct access to query methods for advanced usage
    refetchStatus: winnerStatusQuery.refetch,
    
    // Status indicators for debugging
    isSuccess: winnerStatusQuery.isSuccess && !winnerStatusQuery.isError,
    isStale: winnerStatusQuery.isStale
  };
}

// Note: All types are already exported at declaration
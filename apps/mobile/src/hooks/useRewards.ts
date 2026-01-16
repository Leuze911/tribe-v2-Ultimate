import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsService, RewardsOverview, ChallengesOverview, LeaderboardResponse, ClaimChallengeResponse } from '../services/rewards';

export function useRewards() {
  return useQuery<RewardsOverview>({
    queryKey: ['rewards'],
    queryFn: () => rewardsService.getRewards(),
  });
}

export function useChallenges() {
  return useQuery<ChallengesOverview>({
    queryKey: ['challenges'],
    queryFn: () => rewardsService.getChallenges(),
  });
}

export function useLeaderboard(
  period: 'all_time' | 'monthly' | 'weekly' = 'all_time',
  limit: number = 20
) {
  return useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', period, limit],
    queryFn: () => rewardsService.getLeaderboard(period, limit),
  });
}

export function useCheckBadges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => rewardsService.checkBadges(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}

export function useClaimChallenge() {
  const queryClient = useQueryClient();

  return useMutation<ClaimChallengeResponse, Error, string>({
    mutationFn: (challengeId: string) => rewardsService.claimChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}

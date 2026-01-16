import { api } from './api';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'exploration' | 'collection' | 'validation' | 'social' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpRequired: number;
  poisRequired: number;
  xpReward: number;
  earnedAt?: string;
  isEarned: boolean;
  progress: number;
}

export interface RewardsOverview {
  totalBadges: number;
  earnedBadges: number;
  currentXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  badges: Badge[];
  recentBadges: Badge[];
}

export interface Challenge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly' | 'special';
  action: string;
  targetCount: number;
  xpReward: number;
  progress: number;
  status: 'active' | 'completed' | 'claimed' | 'expired';
  expiresAt?: string;
  completedAt?: string;
}

export interface ChallengesOverview {
  daily: Challenge[];
  weekly: Challenge[];
  special: Challenge[];
  completedToday: number;
  totalAvailable: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  points: number;
  level: number;
  poisCount: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  period: 'all_time' | 'monthly' | 'weekly';
  totalUsers: number;
  currentUserRank?: LeaderboardEntry;
}

export interface ClaimChallengeResponse {
  success: boolean;
  challenge: Challenge;
  xpAwarded: number;
  newTotalXp: number;
  levelUp?: boolean;
  newLevel?: number;
}

class RewardsService {
  async getRewards(): Promise<RewardsOverview> {
    const response = await api.get<RewardsOverview>('/rewards');
    return response.data;
  }

  async getBadges(): Promise<RewardsOverview> {
    const response = await api.get<RewardsOverview>('/rewards/badges');
    return response.data;
  }

  async checkBadges(): Promise<{ newBadges: Badge[] }> {
    const response = await api.post<{ newBadges: Badge[] }>('/rewards/badges/check');
    return response.data;
  }

  async getChallenges(): Promise<ChallengesOverview> {
    const response = await api.get<ChallengesOverview>('/rewards/challenges');
    return response.data;
  }

  async claimChallenge(challengeId: string): Promise<ClaimChallengeResponse> {
    const response = await api.post<ClaimChallengeResponse>('/rewards/challenges/claim', {
      challengeId,
    });
    return response.data;
  }

  async getLeaderboard(
    period: 'all_time' | 'monthly' | 'weekly' = 'all_time',
    limit: number = 20,
    offset: number = 0
  ): Promise<LeaderboardResponse> {
    const response = await api.get<LeaderboardResponse>('/rewards/leaderboard', {
      params: { period, limit, offset },
    });
    return response.data;
  }
}

export const rewardsService = new RewardsService();
export default rewardsService;

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { Badge, BadgeCategory, BadgeTier } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Challenge, ChallengeType, ChallengeAction } from './entities/challenge.entity';
import { UserChallenge, UserChallengeStatus } from './entities/user-challenge.entity';
import { Profile } from '../users/entities/profile.entity';
import { Location } from '../locations/entities/location.entity';
import {
  BadgeResponseDto,
  RewardsOverviewDto,
  ClaimBadgeResponseDto,
} from './dto/badge.dto';
import {
  ChallengeResponseDto,
  ChallengesOverviewDto,
  ClaimChallengeResponseDto,
} from './dto/challenge.dto';
import {
  LeaderboardQueryDto,
  LeaderboardResponseDto,
  LeaderboardEntryDto,
  LeaderboardPeriod,
} from './dto/leaderboard.dto';

// XP thresholds for each level (cumulative XP needed)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  3500,   // Level 7
  5500,   // Level 8
  8000,   // Level 9
  12000,  // Level 10
];

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(UserChallenge)
    private userChallengeRepository: Repository<UserChallenge>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  async getRewardsOverview(userId: string): Promise<RewardsOverviewDto> {
    const user = await this.profileRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allBadges = await this.badgeRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });

    const earnedBadges = await this.userBadgeRepository.find({
      where: { userId },
      relations: ['badge'],
    });

    const earnedBadgeIds = new Set(earnedBadges.map(ub => ub.badgeId));

    // Get user's POI count
    const poisCount = await this.locationRepository.count({
      where: { collectorId: userId },
    });

    const badges: BadgeResponseDto[] = allBadges.map(badge => {
      const earned = earnedBadgeIds.has(badge.id);
      const userBadge = earnedBadges.find(ub => ub.badgeId === badge.id);

      // Calculate progress
      let progress = 0;
      if (badge.xpRequired > 0) {
        progress = Math.min(100, Math.floor((user.points / badge.xpRequired) * 100));
      } else if (badge.poisRequired > 0) {
        progress = Math.min(100, Math.floor((poisCount / badge.poisRequired) * 100));
      }

      return {
        id: badge.id,
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        tier: badge.tier,
        xpRequired: badge.xpRequired,
        poisRequired: badge.poisRequired,
        xpReward: badge.xpReward,
        earnedAt: userBadge?.earnedAt,
        isEarned: earned,
        progress: earned ? 100 : progress,
      };
    });

    const recentBadges = badges
      .filter(b => b.isEarned)
      .sort((a, b) => {
        if (!a.earnedAt || !b.earnedAt) return 0;
        return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
      })
      .slice(0, 3);

    const currentLevel = this.calculateLevel(user.points);
    const xpToNextLevel = this.calculateXpToNextLevel(user.points);

    return {
      totalBadges: allBadges.length,
      earnedBadges: earnedBadges.length,
      currentXp: user.points,
      currentLevel,
      xpToNextLevel,
      badges,
      recentBadges,
    };
  }

  async checkAndAwardBadges(userId: string): Promise<BadgeResponseDto[]> {
    const user = await this.profileRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    const allBadges = await this.badgeRepository.find({ where: { isActive: true } });
    const earnedBadges = await this.userBadgeRepository.find({ where: { userId } });
    const earnedBadgeIds = new Set(earnedBadges.map(ub => ub.badgeId));

    const poisCount = await this.locationRepository.count({
      where: { collectorId: userId },
    });

    const newBadges: BadgeResponseDto[] = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let earned = false;

      // Check XP requirement
      if (badge.xpRequired > 0 && user.points >= badge.xpRequired) {
        earned = true;
      }

      // Check POI requirement
      if (badge.poisRequired > 0 && poisCount >= badge.poisRequired) {
        earned = true;
      }

      if (earned) {
        const userBadge = this.userBadgeRepository.create({
          userId,
          badgeId: badge.id,
        });
        await this.userBadgeRepository.save(userBadge);

        // Award XP bonus
        if (badge.xpReward > 0) {
          await this.profileRepository.increment({ id: userId }, 'points', badge.xpReward);
        }

        newBadges.push({
          id: badge.id,
          code: badge.code,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          tier: badge.tier,
          xpRequired: badge.xpRequired,
          poisRequired: badge.poisRequired,
          xpReward: badge.xpReward,
          earnedAt: userBadge.earnedAt,
          isEarned: true,
          progress: 100,
        });
      }
    }

    // Update user level
    await this.updateUserLevel(userId);

    return newBadges;
  }

  async getChallenges(userId: string): Promise<ChallengesOverviewDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // Get active challenges
    const dailyChallenges = await this.challengeRepository.find({
      where: { type: ChallengeType.DAILY, isActive: true },
    });

    const weeklyChallenges = await this.challengeRepository.find({
      where: { type: ChallengeType.WEEKLY, isActive: true },
    });

    const specialChallenges = await this.challengeRepository.find({
      where: { type: ChallengeType.SPECIAL, isActive: true },
    });

    // Get or create user challenges
    const userChallenges = await this.getOrCreateUserChallenges(
      userId,
      [...dailyChallenges, ...weeklyChallenges, ...specialChallenges],
      today,
      weekStart,
    );

    const userChallengeMap = new Map(
      userChallenges.map(uc => [uc.challengeId, uc]),
    );

    const mapChallenge = (challenge: Challenge): ChallengeResponseDto => {
      const uc = userChallengeMap.get(challenge.id);
      return {
        id: challenge.id,
        code: challenge.code,
        title: challenge.title,
        description: challenge.description,
        icon: challenge.icon,
        type: challenge.type,
        action: challenge.action,
        targetCount: challenge.targetCount,
        xpReward: challenge.xpReward,
        progress: uc?.progress || 0,
        status: uc?.status || UserChallengeStatus.ACTIVE,
        expiresAt: uc?.expiresAt,
        completedAt: uc?.completedAt,
      };
    };

    const completedToday = userChallenges.filter(
      uc =>
        uc.status === UserChallengeStatus.COMPLETED ||
        uc.status === UserChallengeStatus.CLAIMED,
    ).length;

    return {
      daily: dailyChallenges.map(mapChallenge),
      weekly: weeklyChallenges.map(mapChallenge),
      special: specialChallenges.map(mapChallenge),
      completedToday,
      totalAvailable:
        dailyChallenges.length + weeklyChallenges.length + specialChallenges.length,
    };
  }

  async updateChallengeProgress(
    userId: string,
    action: ChallengeAction,
    category?: string,
  ): Promise<ChallengeResponseDto[]> {
    const userChallenges = await this.userChallengeRepository.find({
      where: {
        userId,
        status: UserChallengeStatus.ACTIVE,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['challenge'],
    });

    const completedChallenges: ChallengeResponseDto[] = [];

    for (const uc of userChallenges) {
      if (uc.challenge.action !== action) continue;

      // Check category filter if applicable
      if (uc.challenge.categoryFilter && category !== uc.challenge.categoryFilter) {
        continue;
      }

      uc.progress += 1;

      if (uc.progress >= uc.challenge.targetCount) {
        uc.status = UserChallengeStatus.COMPLETED;
        uc.completedAt = new Date();
      }

      await this.userChallengeRepository.save(uc);

      if (uc.status === UserChallengeStatus.COMPLETED) {
        completedChallenges.push({
          id: uc.challenge.id,
          code: uc.challenge.code,
          title: uc.challenge.title,
          description: uc.challenge.description,
          icon: uc.challenge.icon,
          type: uc.challenge.type,
          action: uc.challenge.action,
          targetCount: uc.challenge.targetCount,
          xpReward: uc.challenge.xpReward,
          progress: uc.progress,
          status: uc.status,
          expiresAt: uc.expiresAt,
          completedAt: uc.completedAt,
        });
      }
    }

    return completedChallenges;
  }

  async claimChallenge(
    userId: string,
    challengeId: string,
  ): Promise<ClaimChallengeResponseDto> {
    const userChallenge = await this.userChallengeRepository.findOne({
      where: { userId, challengeId, status: UserChallengeStatus.COMPLETED },
      relations: ['challenge'],
    });

    if (!userChallenge) {
      throw new BadRequestException('Challenge not completed or already claimed');
    }

    const user = await this.profileRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldLevel = this.calculateLevel(user.points);
    const xpReward = userChallenge.challenge.xpReward;

    // Update challenge status
    userChallenge.status = UserChallengeStatus.CLAIMED;
    userChallenge.claimedAt = new Date();
    await this.userChallengeRepository.save(userChallenge);

    // Award XP
    await this.profileRepository.increment({ id: userId }, 'points', xpReward);
    const newTotalXp = user.points + xpReward;
    const newLevel = this.calculateLevel(newTotalXp);

    // Update level if changed
    if (newLevel > oldLevel) {
      await this.profileRepository.update({ id: userId }, { level: newLevel });
    }

    return {
      success: true,
      challenge: {
        id: userChallenge.challenge.id,
        code: userChallenge.challenge.code,
        title: userChallenge.challenge.title,
        description: userChallenge.challenge.description,
        icon: userChallenge.challenge.icon,
        type: userChallenge.challenge.type,
        action: userChallenge.challenge.action,
        targetCount: userChallenge.challenge.targetCount,
        xpReward: userChallenge.challenge.xpReward,
        progress: userChallenge.progress,
        status: userChallenge.status,
        expiresAt: userChallenge.expiresAt,
        completedAt: userChallenge.completedAt,
      },
      xpAwarded: xpReward,
      newTotalXp,
      levelUp: newLevel > oldLevel,
      newLevel: newLevel > oldLevel ? newLevel : undefined,
    };
  }

  async getLeaderboard(
    userId: string,
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    const { period, limit, offset } = query;

    let dateFilter: Date | undefined;
    const now = new Date();

    if (period === LeaderboardPeriod.WEEKLY) {
      dateFilter = new Date(now);
      dateFilter.setDate(now.getDate() - 7);
    } else if (period === LeaderboardPeriod.MONTHLY) {
      dateFilter = new Date(now);
      dateFilter.setMonth(now.getMonth() - 1);
    }

    // For period-based leaderboards, we'd need to track points earned in period
    // For simplicity, we use total points for all periods in this implementation
    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .select([
        'profile.id',
        'profile.fullName',
        'profile.avatarUrl',
        'profile.points',
        'profile.level',
      ])
      .where('profile.isActive = :isActive', { isActive: true })
      .orderBy('profile.points', 'DESC')
      .skip(offset)
      .take(limit);

    const [profiles, totalUsers] = await queryBuilder.getManyAndCount();

    // Get POI counts for each user
    const userIds = profiles.map(p => p.id);
    const poiCounts = await this.locationRepository
      .createQueryBuilder('location')
      .select('location.collectorId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('location.collectorId IN (:...userIds)', { userIds: userIds.length ? userIds : [''] })
      .groupBy('location.collectorId')
      .getRawMany();

    const poiCountMap = new Map(poiCounts.map(pc => [pc.userId, parseInt(pc.count)]));

    const offsetValue = offset ?? 0;
    const entries: LeaderboardEntryDto[] = profiles.map((profile, index) => ({
      rank: offsetValue + index + 1,
      userId: profile.id,
      username: profile.fullName || 'Anonymous',
      avatarUrl: profile.avatarUrl || undefined,
      points: profile.points,
      level: profile.level,
      poisCount: poiCountMap.get(profile.id) || 0,
      isCurrentUser: profile.id === userId,
    }));

    // Get current user's rank if not in list
    let currentUserRank: LeaderboardEntryDto | undefined;
    const userInList = entries.find(e => e.userId === userId);

    if (!userInList) {
      const userRankResult = await this.profileRepository
        .createQueryBuilder('profile')
        .select('COUNT(*) + 1', 'rank')
        .where('profile.points > (SELECT points FROM profiles WHERE id = :userId)', { userId })
        .getRawOne();

      const currentUser = await this.profileRepository.findOne({ where: { id: userId } });
      if (currentUser) {
        const userPoiCount = await this.locationRepository.count({
          where: { collectorId: userId },
        });

        currentUserRank = {
          rank: parseInt(userRankResult?.rank || '0'),
          userId: currentUser.id,
          username: currentUser.fullName || 'Anonymous',
          avatarUrl: currentUser.avatarUrl || undefined,
          points: currentUser.points,
          level: currentUser.level,
          poisCount: userPoiCount,
          isCurrentUser: true,
        };
      }
    }

    return {
      entries,
      period: period ?? LeaderboardPeriod.ALL_TIME,
      totalUsers,
      currentUserRank,
    };
  }

  async seedDefaultBadges(): Promise<void> {
    const existingCount = await this.badgeRepository.count();
    if (existingCount > 0) return;

    const defaultBadges: Partial<Badge>[] = [
      {
        code: 'explorer',
        name: 'Explorateur',
        description: 'Bienvenue dans TRIBE!',
        icon: 'compass',
        category: BadgeCategory.EXPLORATION,
        tier: BadgeTier.BRONZE,
        xpRequired: 0,
        poisRequired: 0,
        xpReward: 10,
        displayOrder: 1,
      },
      {
        code: 'discoverer',
        name: 'Découvreur',
        description: 'Créez votre premier POI',
        icon: 'map-pin',
        category: BadgeCategory.COLLECTION,
        tier: BadgeTier.BRONZE,
        xpRequired: 0,
        poisRequired: 1,
        xpReward: 25,
        displayOrder: 2,
      },
      {
        code: 'traveler',
        name: 'Voyageur',
        description: 'Créez 5 POIs',
        icon: 'navigation',
        category: BadgeCategory.COLLECTION,
        tier: BadgeTier.SILVER,
        xpRequired: 0,
        poisRequired: 5,
        xpReward: 50,
        displayOrder: 3,
      },
      {
        code: 'cartographer',
        name: 'Cartographe',
        description: 'Créez 10 POIs',
        icon: 'map',
        category: BadgeCategory.COLLECTION,
        tier: BadgeTier.SILVER,
        xpRequired: 0,
        poisRequired: 10,
        xpReward: 100,
        displayOrder: 4,
      },
      {
        code: 'local_guide',
        name: 'Guide Local',
        description: 'Créez 25 POIs',
        icon: 'award',
        category: BadgeCategory.COLLECTION,
        tier: BadgeTier.GOLD,
        xpRequired: 0,
        poisRequired: 25,
        xpReward: 200,
        displayOrder: 5,
      },
      {
        code: 'expert',
        name: 'Expert',
        description: 'Créez 50 POIs',
        icon: 'star',
        category: BadgeCategory.COLLECTION,
        tier: BadgeTier.PLATINUM,
        xpRequired: 0,
        poisRequired: 50,
        xpReward: 500,
        displayOrder: 6,
      },
      {
        code: 'rising_star',
        name: 'Étoile Montante',
        description: 'Atteignez 100 XP',
        icon: 'trending-up',
        category: BadgeCategory.EXPLORATION,
        tier: BadgeTier.BRONZE,
        xpRequired: 100,
        poisRequired: 0,
        xpReward: 25,
        displayOrder: 7,
      },
      {
        code: 'champion',
        name: 'Champion',
        description: 'Atteignez 500 XP',
        icon: 'trophy',
        category: BadgeCategory.EXPLORATION,
        tier: BadgeTier.GOLD,
        xpRequired: 500,
        poisRequired: 0,
        xpReward: 100,
        displayOrder: 8,
      },
    ];

    for (const badge of defaultBadges) {
      const entity = this.badgeRepository.create(badge);
      await this.badgeRepository.save(entity);
    }
  }

  async seedDefaultChallenges(): Promise<void> {
    const existingCount = await this.challengeRepository.count();
    if (existingCount > 0) return;

    const defaultChallenges: Partial<Challenge>[] = [
      {
        code: 'daily_poi_1',
        title: 'Premier pas',
        description: 'Créez 1 POI aujourd\'hui',
        icon: 'flag',
        type: ChallengeType.DAILY,
        action: ChallengeAction.CREATE_POI,
        targetCount: 1,
        xpReward: 20,
      },
      {
        code: 'daily_poi_3',
        title: 'Explorateur du jour',
        description: 'Créez 3 POIs aujourd\'hui',
        icon: 'map-pin',
        type: ChallengeType.DAILY,
        action: ChallengeAction.CREATE_POI,
        targetCount: 3,
        xpReward: 50,
      },
      {
        code: 'daily_photo',
        title: 'Photographe',
        description: 'Ajoutez 2 photos à vos POIs',
        icon: 'camera',
        type: ChallengeType.DAILY,
        action: ChallengeAction.ADD_PHOTO,
        targetCount: 2,
        xpReward: 30,
      },
      {
        code: 'weekly_poi_10',
        title: 'Contributeur de la semaine',
        description: 'Créez 10 POIs cette semaine',
        icon: 'calendar',
        type: ChallengeType.WEEKLY,
        action: ChallengeAction.CREATE_POI,
        targetCount: 10,
        xpReward: 150,
      },
      {
        code: 'weekly_restaurant',
        title: 'Gourmet',
        description: 'Découvrez 5 restaurants cette semaine',
        icon: 'utensils',
        type: ChallengeType.WEEKLY,
        action: ChallengeAction.EXPLORE_CATEGORY,
        targetCount: 5,
        categoryFilter: 'restaurant',
        xpReward: 100,
      },
    ];

    for (const challenge of defaultChallenges) {
      const entity = this.challengeRepository.create(challenge);
      await this.challengeRepository.save(entity);
    }
  }

  private async getOrCreateUserChallenges(
    userId: string,
    challenges: Challenge[],
    today: Date,
    weekStart: Date,
  ): Promise<UserChallenge[]> {
    const result: UserChallenge[] = [];

    for (const challenge of challenges) {
      let periodStart: Date;
      let expiresAt: Date;

      if (challenge.type === ChallengeType.DAILY) {
        periodStart = today;
        expiresAt = new Date(today);
        expiresAt.setDate(expiresAt.getDate() + 1);
      } else if (challenge.type === ChallengeType.WEEKLY) {
        periodStart = weekStart;
        expiresAt = new Date(weekStart);
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else {
        // Special challenges - 30 day duration
        periodStart = today;
        expiresAt = new Date(today);
        expiresAt.setDate(expiresAt.getDate() + 30);
      }

      let userChallenge = await this.userChallengeRepository.findOne({
        where: {
          userId,
          challengeId: challenge.id,
          periodStart,
        },
        relations: ['challenge'],
      });

      if (!userChallenge) {
        userChallenge = this.userChallengeRepository.create({
          userId,
          challengeId: challenge.id,
          periodStart,
          expiresAt,
          progress: 0,
          status: UserChallengeStatus.ACTIVE,
        });
        userChallenge = await this.userChallengeRepository.save(userChallenge);
        userChallenge.challenge = challenge;
      }

      // Check if expired
      if (
        userChallenge.status === UserChallengeStatus.ACTIVE &&
        new Date() > userChallenge.expiresAt
      ) {
        userChallenge.status = UserChallengeStatus.EXPIRED;
        await this.userChallengeRepository.save(userChallenge);
      }

      result.push(userChallenge);
    }

    return result;
  }

  private calculateLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  private calculateXpToNextLevel(xp: number): number {
    const currentLevel = this.calculateLevel(xp);
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
      return 0; // Max level
    }
    return LEVEL_THRESHOLDS[currentLevel] - xp;
  }

  private async updateUserLevel(userId: string): Promise<void> {
    const user = await this.profileRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const newLevel = this.calculateLevel(user.points);
    if (newLevel !== user.level) {
      await this.profileRepository.update({ id: userId }, { level: newLevel });
    }
  }
}

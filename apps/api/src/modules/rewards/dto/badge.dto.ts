import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BadgeCategory, BadgeTier } from '../entities/badge.entity';

export class BadgeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  icon: string;

  @ApiProperty({ enum: BadgeCategory })
  category: BadgeCategory;

  @ApiProperty({ enum: BadgeTier })
  tier: BadgeTier;

  @ApiProperty()
  xpRequired: number;

  @ApiProperty()
  poisRequired: number;

  @ApiProperty()
  xpReward: number;

  @ApiPropertyOptional()
  earnedAt?: Date;

  @ApiProperty()
  isEarned: boolean;

  @ApiProperty()
  progress: number;
}

export class UserBadgeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  badge: BadgeResponseDto;

  @ApiProperty()
  earnedAt: Date;
}

export class RewardsOverviewDto {
  @ApiProperty()
  totalBadges: number;

  @ApiProperty()
  earnedBadges: number;

  @ApiProperty()
  currentXp: number;

  @ApiProperty()
  currentLevel: number;

  @ApiProperty()
  xpToNextLevel: number;

  @ApiProperty({ type: [BadgeResponseDto] })
  badges: BadgeResponseDto[];

  @ApiProperty({ type: [BadgeResponseDto] })
  recentBadges: BadgeResponseDto[];
}

export class ClaimBadgeDto {
  @ApiProperty()
  badgeId: string;
}

export class ClaimBadgeResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  badge: BadgeResponseDto;

  @ApiProperty()
  xpAwarded: number;

  @ApiProperty()
  newTotalXp: number;

  @ApiPropertyOptional()
  levelUp?: boolean;

  @ApiPropertyOptional()
  newLevel?: number;
}

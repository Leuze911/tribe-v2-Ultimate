import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChallengeType, ChallengeAction } from '../entities/challenge.entity';
import { UserChallengeStatus } from '../entities/user-challenge.entity';

export class ChallengeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  icon: string;

  @ApiProperty({ enum: ChallengeType })
  type: ChallengeType;

  @ApiProperty({ enum: ChallengeAction })
  action: ChallengeAction;

  @ApiProperty()
  targetCount: number;

  @ApiProperty()
  xpReward: number;

  @ApiProperty()
  progress: number;

  @ApiProperty({ enum: UserChallengeStatus })
  status: UserChallengeStatus;

  @ApiPropertyOptional()
  expiresAt?: Date | null;

  @ApiPropertyOptional()
  completedAt?: Date | null;
}

export class ChallengesOverviewDto {
  @ApiProperty({ type: [ChallengeResponseDto] })
  daily: ChallengeResponseDto[];

  @ApiProperty({ type: [ChallengeResponseDto] })
  weekly: ChallengeResponseDto[];

  @ApiProperty({ type: [ChallengeResponseDto] })
  special: ChallengeResponseDto[];

  @ApiProperty()
  completedToday: number;

  @ApiProperty()
  totalAvailable: number;
}

export class ClaimChallengeDto {
  @ApiProperty()
  challengeId: string;
}

export class ClaimChallengeResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  challenge: ChallengeResponseDto;

  @ApiProperty()
  xpAwarded: number;

  @ApiProperty()
  newTotalXp: number;

  @ApiPropertyOptional()
  levelUp?: boolean;

  @ApiPropertyOptional()
  newLevel?: number;
}

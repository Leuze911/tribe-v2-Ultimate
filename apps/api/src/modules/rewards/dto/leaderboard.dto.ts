import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum LeaderboardPeriod {
  ALL_TIME = 'all_time',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
}

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: LeaderboardPeriod, default: LeaderboardPeriod.ALL_TIME })
  @IsEnum(LeaderboardPeriod)
  @IsOptional()
  period?: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}

export class LeaderboardEntryDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  poisCount: number;

  @ApiProperty()
  isCurrentUser: boolean;
}

export class LeaderboardResponseDto {
  @ApiProperty({ type: [LeaderboardEntryDto] })
  entries: LeaderboardEntryDto[];

  @ApiProperty({ enum: LeaderboardPeriod })
  period: LeaderboardPeriod;

  @ApiProperty()
  totalUsers: number;

  @ApiPropertyOptional()
  currentUserRank?: LeaderboardEntryDto;
}

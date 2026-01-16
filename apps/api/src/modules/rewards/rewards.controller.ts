import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RewardsOverviewDto } from './dto/badge.dto';
import {
  ChallengesOverviewDto,
  ClaimChallengeDto,
  ClaimChallengeResponseDto,
} from './dto/challenge.dto';
import {
  LeaderboardQueryDto,
  LeaderboardResponseDto,
} from './dto/leaderboard.dto';

@ApiTags('rewards')
@Controller({ path: 'rewards', version: '1' })
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rewards overview with all badges' })
  @ApiResponse({ status: 200, type: RewardsOverviewDto })
  async getRewards(
    @CurrentUser('sub') userId: string,
  ): Promise<RewardsOverviewDto> {
    return this.rewardsService.getRewardsOverview(userId);
  }

  @Get('badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all badges with progress' })
  @ApiResponse({ status: 200, type: RewardsOverviewDto })
  async getBadges(
    @CurrentUser('sub') userId: string,
  ): Promise<RewardsOverviewDto> {
    return this.rewardsService.getRewardsOverview(userId);
  }

  @Post('badges/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check and award any earned badges' })
  @ApiResponse({ status: 200 })
  async checkBadges(@CurrentUser('sub') userId: string) {
    const newBadges = await this.rewardsService.checkAndAwardBadges(userId);
    return { newBadges };
  }

  @Get('challenges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active challenges' })
  @ApiResponse({ status: 200, type: ChallengesOverviewDto })
  async getChallenges(
    @CurrentUser('sub') userId: string,
  ): Promise<ChallengesOverviewDto> {
    return this.rewardsService.getChallenges(userId);
  }

  @Post('challenges/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim a completed challenge reward' })
  @ApiResponse({ status: 200, type: ClaimChallengeResponseDto })
  async claimChallenge(
    @CurrentUser('sub') userId: string,
    @Body() body: ClaimChallengeDto,
  ): Promise<ClaimChallengeResponseDto> {
    return this.rewardsService.claimChallenge(userId, body.challengeId);
  }

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get leaderboard rankings' })
  @ApiResponse({ status: 200, type: LeaderboardResponseDto })
  async getLeaderboard(
    @CurrentUser('sub') userId: string,
    @Query() query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.rewardsService.getLeaderboard(userId, query);
  }
}

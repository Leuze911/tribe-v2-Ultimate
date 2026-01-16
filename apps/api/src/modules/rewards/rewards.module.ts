import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';
import { Profile } from '../users/entities/profile.entity';
import { Location } from '../locations/entities/location.entity';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Badge,
      UserBadge,
      Challenge,
      UserChallenge,
      Profile,
      Location,
    ]),
    forwardRef(() => LocationsModule),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule implements OnModuleInit {
  constructor(private readonly rewardsService: RewardsService) {}

  async onModuleInit() {
    // Seed default badges and challenges on startup
    await this.rewardsService.seedDefaultBadges();
    await this.rewardsService.seedDefaultChallenges();
  }
}

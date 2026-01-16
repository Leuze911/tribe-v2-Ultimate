import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../users/entities/profile.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
@Unique(['userId', 'badgeId'])
@Index(['userId'])
@Index(['earnedAt'])
export class UserBadge {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @ApiProperty({ description: 'Badge ID' })
  @Column({ name: 'badge_id', type: 'uuid' })
  badgeId: string;

  @ManyToOne(() => Badge, { eager: true })
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;

  @ApiProperty({ description: 'Timestamp when badge was earned' })
  @CreateDateColumn({ name: 'earned_at', type: 'timestamptz' })
  earnedAt: Date;

  @ApiProperty({ description: 'Whether notification was shown' })
  @Column({ name: 'notification_shown', type: 'boolean', default: false })
  notificationShown: boolean;
}

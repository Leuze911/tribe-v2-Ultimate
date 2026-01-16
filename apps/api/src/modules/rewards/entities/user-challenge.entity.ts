import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../users/entities/profile.entity';
import { Challenge } from './challenge.entity';

export enum UserChallengeStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
}

@Entity('user_challenges')
@Unique(['userId', 'challengeId', 'periodStart'])
@Index(['userId'])
@Index(['status'])
@Index(['expiresAt'])
export class UserChallenge {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @ApiProperty({ description: 'Challenge ID' })
  @Column({ name: 'challenge_id', type: 'uuid' })
  challengeId: string;

  @ManyToOne(() => Challenge, { eager: true })
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @ApiProperty({ description: 'Current progress count' })
  @Column({ type: 'int', default: 0 })
  progress: number;

  @ApiProperty({ description: 'Status', enum: UserChallengeStatus })
  @Column({
    type: 'enum',
    enum: UserChallengeStatus,
    enumName: 'user_challenge_status',
    default: UserChallengeStatus.ACTIVE,
  })
  status: UserChallengeStatus;

  @ApiProperty({ description: 'Period start (for daily/weekly tracking)' })
  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @ApiProperty({ description: 'Challenge expiration' })
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @ApiProperty({ description: 'Completion timestamp' })
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ description: 'Claimed timestamp' })
  @Column({ name: 'claimed_at', type: 'timestamptz', nullable: true })
  claimedAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

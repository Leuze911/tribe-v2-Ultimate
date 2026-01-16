import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SPECIAL = 'special',
}

export enum ChallengeAction {
  CREATE_POI = 'create_poi',
  VALIDATE_POI = 'validate_poi',
  ADD_PHOTO = 'add_photo',
  EXPLORE_CATEGORY = 'explore_category',
  VISIT_AREA = 'visit_area',
}

@Entity('challenges')
@Index(['type'])
@Index(['isActive'])
export class Challenge {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Challenge code' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Challenge title' })
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @ApiProperty({ description: 'Challenge description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Challenge icon' })
  @Column({ type: 'varchar', length: 50 })
  icon: string;

  @ApiProperty({ description: 'Challenge type', enum: ChallengeType })
  @Column({
    type: 'enum',
    enum: ChallengeType,
    enumName: 'challenge_type',
  })
  type: ChallengeType;

  @ApiProperty({ description: 'Action to perform', enum: ChallengeAction })
  @Column({
    type: 'enum',
    enum: ChallengeAction,
    enumName: 'challenge_action',
  })
  action: ChallengeAction;

  @ApiProperty({ description: 'Target count to complete' })
  @Column({ name: 'target_count', type: 'int', default: 1 })
  targetCount: number;

  @ApiProperty({ description: 'Optional category filter (for explore_category)' })
  @Column({ name: 'category_filter', type: 'varchar', length: 50, nullable: true })
  categoryFilter: string | null;

  @ApiProperty({ description: 'XP reward on completion' })
  @Column({ name: 'xp_reward', type: 'int', default: 0 })
  xpReward: number;

  @ApiProperty({ description: 'Challenge is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

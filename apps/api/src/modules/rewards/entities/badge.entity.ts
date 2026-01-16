import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum BadgeCategory {
  EXPLORATION = 'exploration',
  COLLECTION = 'collection',
  VALIDATION = 'validation',
  SOCIAL = 'social',
  SPECIAL = 'special',
}

export enum BadgeTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

@Entity('badges')
@Index(['category'])
@Index(['tier'])
@Index(['isActive'])
export class Badge {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Badge code (unique identifier for logic)' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Badge name' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'Badge description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Badge icon name' })
  @Column({ type: 'varchar', length: 50 })
  icon: string;

  @ApiProperty({ description: 'Badge category', enum: BadgeCategory })
  @Column({
    type: 'enum',
    enum: BadgeCategory,
    enumName: 'badge_category',
  })
  category: BadgeCategory;

  @ApiProperty({ description: 'Badge tier/rarity', enum: BadgeTier })
  @Column({
    type: 'enum',
    enum: BadgeTier,
    enumName: 'badge_tier',
    default: BadgeTier.BRONZE,
  })
  tier: BadgeTier;

  @ApiProperty({ description: 'XP required to unlock (0 = achievement based)' })
  @Column({ name: 'xp_required', type: 'int', default: 0 })
  xpRequired: number;

  @ApiProperty({ description: 'POIs required to unlock (0 = other criteria)' })
  @Column({ name: 'pois_required', type: 'int', default: 0 })
  poisRequired: number;

  @ApiProperty({ description: 'XP bonus when earned' })
  @Column({ name: 'xp_reward', type: 'int', default: 0 })
  xpReward: number;

  @ApiProperty({ description: 'Display order' })
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Badge is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

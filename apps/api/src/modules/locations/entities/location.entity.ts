import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../users/entities/profile.entity';

export enum LocationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
}

export enum LocationCategory {
  RESTAURANT = 'restaurant',
  SHOP = 'shop',
  SERVICE = 'service',
  HEALTH = 'health',
  EDUCATION = 'education',
  TRANSPORT = 'transport',
  TOURISM = 'tourism',
  CULTURE = 'culture',
  SPORT = 'sport',
  OTHER = 'other',
}

@Entity('locations')
@Index(['status'])
@Index(['category'])
@Index(['city'])
export class Location {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Collector user ID' })
  @Column({ name: 'collector_id', type: 'uuid', nullable: true })
  collectorId: string | null;

  @ManyToOne(() => Profile, { eager: true })
  @JoinColumn({ name: 'collector_id' })
  collector: Profile;

  @ApiProperty({ description: 'Location name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Location category', enum: LocationCategory })
  @Column({
    type: 'enum',
    enum: LocationCategory,
    enumName: 'location_category',
  })
  category: LocationCategory;

  @ApiProperty({ description: 'Description of the location', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Latitude coordinate' })
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @ApiProperty({ description: 'GPS accuracy in meters', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  accuracy: number | null;

  @ApiProperty({ description: 'Street address', required: false })
  @Column({ type: 'text', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'City name' })
  @Column({ type: 'varchar', length: 100, default: 'Dakar' })
  city: string;

  @ApiProperty({ description: 'Array of photo URLs' })
  @Column({ type: 'text', array: true, default: '{}' })
  photos: string[];

  @ApiProperty({ description: 'Additional metadata' })
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @ApiProperty({ description: 'Validation status', enum: LocationStatus })
  @Column({
    type: 'enum',
    enum: LocationStatus,
    enumName: 'location_status',
    default: LocationStatus.PENDING,
  })
  status: LocationStatus;

  @ApiProperty({ description: 'Validator user ID', required: false })
  @Column({ name: 'validated_by', type: 'uuid', nullable: true })
  validatedBy: string | null;

  @ApiProperty({ description: 'Validation timestamp', required: false })
  @Column({ name: 'validated_at', type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  @ApiProperty({ description: 'Rejection reason', required: false })
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ description: 'Points awarded for this location' })
  @Column({ name: 'points_awarded', type: 'int', default: 0 })
  pointsAwarded: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

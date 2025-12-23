import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('profiles')
@Index(['level'])
export class Profile {
  @ApiProperty({ description: 'Unique identifier (matches Supabase Auth user ID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User email' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @ApiProperty({ description: 'Full name', required: false })
  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @ApiProperty({ description: 'Phone number', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'User role' })
  @Column({ type: 'enum', enum: ['collector', 'validator', 'admin'], default: 'collector' })
  role: string;

  @ApiProperty({ description: 'Total points earned' })
  @Column({ type: 'int', default: 0 })
  points: number;

  @ApiProperty({ description: 'Current level' })
  @Column({ type: 'int', default: 1 })
  level: number;

  @ApiProperty({ description: 'Account active status' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

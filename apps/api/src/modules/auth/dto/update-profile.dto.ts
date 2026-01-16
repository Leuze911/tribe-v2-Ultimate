import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '+221771234567', description: 'Phone number' })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { LocationCategory } from '../entities/location.entity';

export class CreateLocationDto {
  @ApiProperty({ description: 'Location name', example: 'Restaurant Le Lagon' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Location category',
    enum: LocationCategory,
    example: LocationCategory.RESTAURANT,
  })
  @IsEnum(LocationCategory)
  category: LocationCategory;

  @ApiPropertyOptional({
    description: 'Description of the location',
    example: 'Restaurant sénégalais avec vue sur mer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 14.6937,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -17.4441,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'GPS accuracy in meters',
    example: 10.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Street address',
    example: 'Route de la Corniche, Dakar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'Dakar',
    default: 'Dakar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Array of photo URLs',
    type: [String],
    example: ['https://minio.tribe.sn/photos/location1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: Object,
    example: { openingHours: '08:00-22:00', phone: '+221 33 123 4567' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

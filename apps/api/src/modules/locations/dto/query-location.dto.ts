import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationStatus, LocationCategory } from '../entities/location.entity';

export class QueryLocationDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: LocationStatus,
  })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: LocationCategory,
  })
  @IsOptional()
  @IsEnum(LocationCategory)
  category?: LocationCategory;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Dakar',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by collector ID',
  })
  @IsOptional()
  @IsString()
  collectorId?: string;

  @ApiPropertyOptional({
    description: 'Search term (name, description, address)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class NearbyLocationDto {
  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 14.6937,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: -17.4441,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({
    description: 'Search radius in kilometers',
    default: 5,
    minimum: 0.1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number = 5;
}

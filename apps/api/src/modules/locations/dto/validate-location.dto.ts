import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export enum ValidationAction {
  VALIDATE = 'validate',
  REJECT = 'reject',
}

export class ValidateLocationDto {
  @ApiProperty({
    description: 'Validation action',
    enum: ValidationAction,
    example: ValidationAction.VALIDATE,
  })
  @IsEnum(ValidationAction)
  action: ValidationAction;

  @ApiPropertyOptional({
    description: 'Rejection reason (required if action is reject)',
    example: 'Duplicate location',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Points to award (if not specified, calculated automatically)',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pointsToAward?: number;
}

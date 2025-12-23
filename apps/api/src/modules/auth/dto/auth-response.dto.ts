import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string | null;

  @ApiProperty()
  phone: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: 'Token expiration in seconds', example: 86400 })
  expiresIn: number;

  @ApiProperty({ description: 'User information', type: UserResponseDto })
  user: UserResponseDto;
}

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Profile } from '../users/entities/profile.entity';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number = 86400; // 24 hours

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>(
      'SUPABASE_JWT_SECRET',
      'super-secret-jwt-token-with-at-least-32-characters-long',
    );
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, fullName, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.profileRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = this.profileRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName: fullName || null,
      phone: phone || null,
      role: 'collector',
      points: 0,
      level: 1,
      isActive: true,
    });

    await this.profileRepository.save(user);
    this.logger.log(`New user registered: ${user.email}`);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: this.mapToUserResponse(user),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.profileRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte a été désactivé');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    this.logger.log(`User logged in: ${user.email}`);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: this.mapToUserResponse(user),
    };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return this.mapToUserResponse(user);
  }

  private generateToken(user: Profile): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      aud: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.jwtExpiresIn,
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  private mapToUserResponse(user: Profile): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      points: user.points,
      level: user.level,
      createdAt: user.createdAt,
    };
  }
}

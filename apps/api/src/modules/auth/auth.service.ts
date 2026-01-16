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
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto, UpdateProfileDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import * as crypto from 'crypto';
import { GoogleProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number = 86400; // 24 hours
  // In-memory store for password reset tokens (use Redis in production)
  private readonly resetTokens = new Map<string, { userId: string; expiresAt: Date }>();

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

  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Update only provided fields
    if (updateDto.fullName !== undefined) {
      user.fullName = updateDto.fullName;
    }
    if (updateDto.phone !== undefined) {
      user.phone = updateDto.phone;
    }
    if (updateDto.avatarUrl !== undefined) {
      user.avatarUrl = updateDto.avatarUrl;
    }

    await this.profileRepository.save(user);
    this.logger.log(`Profile updated for user: ${user.email}`);

    return this.mapToUserResponse(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Check if user has a password (not Google account)
    if (!user.passwordHash) {
      throw new UnauthorizedException('Ce compte utilise Google pour la connexion');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    await this.profileRepository.save(user);
    this.logger.log(`Password changed for user: ${user.email}`);

    return { message: 'Mot de passe modifié avec succès' };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await this.profileRepository.save(user);
    this.logger.log(`Account deactivated for user: ${user.email}`);

    return { message: 'Compte supprimé avec succès' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.profileRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    }

    // Check if user is a Google account (no password)
    if (!user.passwordHash) {
      this.logger.log(`Password reset requested for Google account: ${email}`);
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token
    this.resetTokens.set(token, { userId: user.id, expiresAt });

    // TODO: In production, send email with reset link
    // For now, log the token (demo mode)
    this.logger.log(`Password reset token for ${email}: ${token}`);
    this.logger.log(`Reset link: /reset-password?token=${token}`);

    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Find and validate token
    const tokenData = this.resetTokens.get(token);
    if (!tokenData) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    if (new Date() > tokenData.expiresAt) {
      this.resetTokens.delete(token);
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    // Find user
    const user = await this.profileRepository.findOne({
      where: { id: tokenData.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Update password
    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await this.profileRepository.save(user);

    // Remove used token
    this.resetTokens.delete(token);
    this.logger.log(`Password reset completed for user: ${user.email}`);

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  async validateGoogleToken(idToken: string): Promise<AuthResponseDto> {
    try {
      // Decode and verify the Google ID token
      // In production, you should verify the token signature with Google's public keys
      const tokenPayload = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64').toString()
      );

      const googleProfile: GoogleProfile = {
        id: tokenPayload.sub,
        email: tokenPayload.email,
        fullName: tokenPayload.name || `${tokenPayload.given_name} ${tokenPayload.family_name}`.trim(),
        avatarUrl: tokenPayload.picture,
        verified: tokenPayload.email_verified,
      };

      return this.validateGoogleUser(googleProfile);
    } catch (error) {
      this.logger.error('Invalid Google token', error);
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async validateGoogleUser(googleProfile: GoogleProfile): Promise<AuthResponseDto> {
    const { email, fullName, avatarUrl } = googleProfile;

    // Check if user already exists
    let user = await this.profileRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Create new user for Google login
      user = this.profileRepository.create({
        email: email.toLowerCase(),
        passwordHash: '', // Empty for Google accounts
        fullName: fullName || null,
        avatarUrl: avatarUrl || null,
        role: 'collector',
        points: 0,
        level: 1,
        isActive: true,
      });

      await this.profileRepository.save(user);
      this.logger.log(`New Google user registered: ${user.email}`);
    } else {
      // Update avatar if not set
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        await this.profileRepository.save(user);
      }
      this.logger.log(`Google user logged in: ${user.email}`);
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: this.mapToUserResponse(user),
    };
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

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  verified: boolean;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/v1/auth/google/callback';

    console.log('[GoogleStrategy] Loading config:', {
      clientID: clientID ? `${clientID.substring(0, 20)}...` : 'NOT SET',
      clientSecret: clientSecret ? '***SET***' : 'NOT SET',
      callbackURL,
    });

    // Use placeholder values if not configured (strategy won't work but app starts)
    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL,
      scope: ['email', 'profile'],
    });

    if (clientID && clientSecret) {
      this.logger.log('Google OAuth configured successfully');
    } else {
      this.logger.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const googleProfile: GoogleProfile = {
      id,
      email: emails[0].value,
      fullName: `${name.givenName} ${name.familyName}`.trim(),
      avatarUrl: photos?.[0]?.value || null,
      verified: emails[0].verified,
    };

    done(null, googleProfile);
  }
}

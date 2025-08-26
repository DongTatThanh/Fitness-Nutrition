import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';
    if (!clientID || !clientSecret) {
      throw new Error('Missing Google OAuth configuration: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment');
    }
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const user = await this.authService.findOrCreateFromGoogle({ email, googleId, profile });
    return user;
  }
}

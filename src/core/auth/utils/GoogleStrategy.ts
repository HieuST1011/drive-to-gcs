import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: AuthService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
      scope: ['profile', 'email'],
      accessType: 'offline', // Request offline access for refreshToken
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken || 'No refresh token');
    console.log('Profile:', profile);

    try {
      const user = await this.authService.validateUser(
        {
          email: profile.emails[0].value,
          displayName: profile.displayName,
        },
        { accessToken, refreshToken },
      );

      console.log('Validate');
      console.log(user);
      return user || null;
    } catch (error) {
      return error || null;
    }
  }
}

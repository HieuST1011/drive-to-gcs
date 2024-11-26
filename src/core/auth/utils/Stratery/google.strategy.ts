import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from '../../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: AuthService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
      scope: [
        'profile',
        'email',
        'openid',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.install',
      ],
    });
  }

  // make sure to add this or else you won't get the refresh token
  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // Enhanced logging
    console.log('Complete OAuth Response:', {
      accessToken: accessToken?.substring(0, 20) + '...',
      refreshToken: refreshToken?.substring(0, 20) + '...',
      profile: {
        id: profile.id,
        email: profile.emails[0].value,
        displayName: profile.displayName,
      },
    });

    const user = await this.authService.validateUser(
      {
        email: profile.emails[0].value,
        displayName: profile.displayName,
      },
      {
        accessToken,
        refreshToken,
      },
    );

    return user;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../auth.service';

@Injectable()
export class CheckTokenExpiryGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Skip token validation for webhook URLs
    if (url.startsWith('/api/webhook')) {
      return true; // Skip the guard for webhook URLs
    }

    const accessToken = request.cookies['access_token'];
    let validAccessToken = accessToken;

    if (await this.authService.isTokenExpired(accessToken)) {
      const refreshToken = request.cookies['refresh_token'];

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      try {
        const newAccessToken =
          await this.authService.getNewAccessToken(refreshToken);
        request.res.cookie('access_token', newAccessToken, {
          httpOnly: true,
        });
        request.cookies['access_token'] = newAccessToken;
        validAccessToken = newAccessToken;
      } catch (error) {
        throw new UnauthorizedException('Failed to refresh token');
      }
    }

    // Find user by the valid access token
    const user = await this.authService.findUserByAccessToken(validAccessToken);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Attach the user to the request object for later use
    request.user = user;

    return true;
  }
}

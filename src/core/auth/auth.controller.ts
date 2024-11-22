import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  login(): string {
    return this.authService.getAuthUrl();
  }

  @Get('callback')
  async callback(@Query('code') code: string) {
    const tokens = await this.authService.getTokens(code);
    return tokens; // Bạn sẽ cần lưu trữ tokens trong DB để sử dụng sau này
  }
}

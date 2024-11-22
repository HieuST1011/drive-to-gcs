import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { UserDetails } from 'src/utils/types';
import { Repository } from 'typeorm';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  // async validateUser(details: UserDetails) {
  //   console.log('AuthService');
  //   console.log(details);
  //   const user = await this.userRepository.findOneBy({ email: details.email });
  //   console.log(user);
  //   if (user) return user;
  //   console.log('User not found. Creating...');
  //   const newUser = this.userRepository.create(details);
  //   return this.userRepository.save(newUser);
  // }

  async validateUser(
    details: UserDetails,
    tokens?: { accessToken: string; refreshToken: string },
  ) {
    console.log('AuthService');
    console.log(details);

    const user = await this.userRepository.findOneBy({ email: details.email });
    if (user) {
      // Cập nhật accessToken và refreshToken
      user.accessToken = tokens?.accessToken || user.accessToken;
      user.refreshToken = tokens?.refreshToken || user.refreshToken;
      return this.userRepository.save(user);
    }

    console.log('User not found. Creating...');
    const newUser = this.userRepository.create({
      ...details,
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
    });
    return this.userRepository.save(newUser);
  }

  async findUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    return user;
  }

  async refreshAccessToken(userId: number) {
    const user = await this.findUser(userId);
    if (!user?.refreshToken) {
      throw new Error('User not found or missing refresh token');
    }

    const url = 'https://oauth2.googleapis.com/token';
    const data = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: user.refreshToken,
      grant_type: 'refresh_token',
    };

    const response = await axios.post(url, data);
    const { access_token } = response.data;

    // Lưu accessToken mới vào database
    user.accessToken = access_token;
    await this.userRepository.save(user);

    return access_token;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  constructor(private config: ConfigService) {}

  get nodeEnv(): string {
    return this.config.get('NODE_ENV');
  }

  get jwtSecret(): string {
    return this.config.get<string>('JWT_SECRET');
  }

  get jwtExpiration(): string {
    return this.config.get<string>('JWT_EXPIRATION');
  }
}

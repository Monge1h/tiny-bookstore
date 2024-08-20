import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigurationService } from './configuration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
  ],
  providers: [ConfigurationService, ConfigService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}

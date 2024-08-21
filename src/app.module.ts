import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { BooksModule } from './books/books.module';

@Module({
  imports: [AuthModule, DatabaseModule, ConfigurationModule, BooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

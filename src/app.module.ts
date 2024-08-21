import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { BooksModule } from './books/books.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    ConfigurationModule,
    BooksModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

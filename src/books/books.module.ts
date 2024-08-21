import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [BooksController],
  providers: [BooksService],
  imports: [CloudinaryModule, AuthModule],
})
export class BooksModule {}

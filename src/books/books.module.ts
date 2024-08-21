import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  controllers: [BooksController],
  providers: [BooksService],
  imports: [CloudinaryModule],
})
export class BooksModule {}

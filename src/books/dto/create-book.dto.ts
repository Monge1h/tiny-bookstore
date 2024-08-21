import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';
import { BookType } from '@prisma/client';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsEnum(BookType) // Valida que el campo sea un valor permitido del enum BookType
  @IsNotEmpty()
  type: BookType;
}

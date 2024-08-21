import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

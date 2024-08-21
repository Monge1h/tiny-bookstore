import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryParamsDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page? = 1;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit? = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  params?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  search?: string;
}

export class PaginateDto {
  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  previousPage: number;

  @ApiProperty()
  nextPage: number;

  @ApiProperty()
  hasEllipsisBefore: boolean;

  @ApiProperty()
  hasEllipsisAfter: boolean;

  @ApiProperty({ type: [Number] })
  pageLinks: number[];
}

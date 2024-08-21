import { IsEnum, IsNotEmpty } from 'class-validator';

export enum FileType {
  IMAGE = 'image',
  PDF = 'pdf',
}

export class UploadFileDto {
  @IsEnum(FileType)
  @IsNotEmpty()
  fileType: FileType;
}

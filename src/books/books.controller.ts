import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { QueryParamsDto } from 'src/shared/dto/pagination.dto';
import {
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new book (Manager only)' })
  @ApiResponse({ status: 201, description: 'Book successfully created.' })
  @ApiForbiddenResponse({
    description: 'Forbidden. Only managers can create books.',
  })
  @ApiBody({ type: CreateBookDto })
  @Post()
  async createBook(@Body() createBookDto: CreateBookDto) {
    return this.booksService.createBook(createBookDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Upload a file (image or PDF) for a book (Manager only)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    type: UploadFileDto,
  })
  @ApiResponse({ status: 200, description: 'File successfully uploaded.' })
  @ApiForbiddenResponse({
    description: 'Forbidden. Only managers can upload files.',
  })
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    return this.booksService.uploadFile(id, file, uploadFileDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a book (Manager only)' })
  @ApiResponse({ status: 200, description: 'Book successfully updated.' })
  @ApiForbiddenResponse({
    description: 'Forbidden. Only managers can update books.',
  })
  @Patch(':id')
  async updateBook(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.updateBook(id, updateBookDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a book (Manager only)' })
  @ApiResponse({ status: 200, description: 'Book successfully deleted.' })
  @ApiForbiddenResponse({
    description: 'Forbidden. Only managers can delete books.',
  })
  @Delete(':id')
  async deleteBook(@Param('id') id: string) {
    return this.booksService.deleteBook(id);
  }

  @ApiOperation({
    summary: 'Get a list of all books with pagination and search',
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'page',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of books returned successfully.',
  })
  @Get()
  findAll(@Query() params: QueryParamsDto) {
    return this.booksService.findAll({ ...params });
  }

  @ApiOperation({ summary: 'Get books by category with pagination and search' })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'page',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of books in the category returned successfully.',
  })
  @Get('category/:categoryId')
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() params: QueryParamsDto,
  ) {
    return this.booksService.searchBooksByCategory(categoryId, { ...params });
  }

  @ApiOperation({ summary: 'Get details of a specific book by ID' })
  @ApiResponse({
    status: 200,
    description: 'Book details returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle like/unlike for a book (Authenticated users only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Like status toggled successfully.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @Post(':id/toggle-like')
  async toggleLike(@Request() req, @Param('id') bookId: string) {
    return this.booksService.toggleLike(req.user.userId, bookId);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { paginateResult } from 'src/shared/utils/pagination.utils';
import { QueryParamsDto } from 'src/shared/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UploadFileDto, FileType } from './dto/upload-file.dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createBook(createBookDto: CreateBookDto) {
    return this.databaseService.book.create({
      data: {
        ...createBookDto,
      },
    });
  }

  async updateBook(id: string, updateBookDto: UpdateBookDto) {
    const book = await this.databaseService.book.findUnique({
      where: { id },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return this.databaseService.book.update({
      where: { id },
      data: {
        ...updateBookDto,
      },
    });
  }

  async uploadFile(
    id: string,
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
  ) {
    const book = await this.findOne(id);
    const result = await this.cloudinaryService.uploadFile(file);

    if (uploadFileDto.fileType === FileType.IMAGE) {
      await this.databaseService.bookImage.create({
        data: {
          bookId: book.id,
          imageUrl: result.secure_url,
          isPrimary: false,
        },
      });
    } else if (uploadFileDto.fileType === FileType.PDF) {
      await this.databaseService.book.update({
        where: { id: book.id },
        data: {
          fileUrl: result.secure_url,
        },
      });
    }

    return {
      message: 'File uploaded successfully',
      url: result.secure_url,
    };
  }

  async deleteBook(id: string) {
    const book = await this.databaseService.book.findUnique({
      where: { id },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    await this.databaseService.book.delete({
      where: { id },
    });

    return { message: 'Book deleted successfully' };
  }

  async findAll({ limit, page, search }: QueryParamsDto) {
    const offset = (page - 1) * limit;

    const searchCondition: Prisma.BookWhereInput = search
      ? {
          isActive: true,
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            {
              author: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
            {
              description: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [count, results] = await Promise.all([
      this.databaseService.book.count({
        where: searchCondition,
      }),
      this.databaseService.book.findMany({
        where: searchCondition,
        skip: offset,
        take: limit,
        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
          images: {
            select: {
              imageUrl: true,
              isPrimary: true,
            },
            orderBy: {
              isPrimary: 'desc',
            },
            take: 1,
          },
        },
      }),
    ]);

    const formattedResults = results.map((book) => ({
      ...book,
      image: book.images.length > 0 ? book.images[0].imageUrl : null,
      likesCount: book._count.likes,
      images: undefined,
      _count: undefined,
    }));

    return paginateResult(count, formattedResults, limit, page);
  }

  async findOne(id: string) {
    const book = await this.databaseService.book.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
        images: {
          select: {
            imageUrl: true,
            isPrimary: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      price: book.price,
      stock: book.stock,
      type: book.type,
      image: book.images.length > 0 ? book.images[0].imageUrl : null,
      likesCount: book._count.likes,
      categories: book.categories.map((category) => category.name),
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    };
  }

  async searchBooksByCategory(
    categoryId: string,
    { search, page, limit }: QueryParamsDto,
  ) {
    const offset = (page - 1) * limit;

    const category = await this.databaseService.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const searchCondition: Prisma.BookWhereInput = search
      ? {
          AND: [
            { categories: { some: { id: categoryId } }, isActive: true },
            {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  author: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            },
          ],
        }
      : {
          categories: { some: { id: categoryId } },
        };

    const [count, results] = await Promise.all([
      this.databaseService.book.count({
        where: searchCondition,
      }),

      this.databaseService.book.findMany({
        where: searchCondition,
        skip: offset,
        take: limit,
        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
          images: {
            select: {
              imageUrl: true,
              isPrimary: true,
            },
            orderBy: {
              isPrimary: 'desc',
            },
            take: 1,
          },
        },
      }),
    ]);

    const formattedResults = results.map((book) => ({
      ...book,
      image: book.images.length > 0 ? book.images[0].imageUrl : null,
      likesCount: book._count.likes,
      images: undefined,
      _count: undefined,
    }));

    return {
      results: formattedResults,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      hasNextPage: offset + limit < count,
      hasPreviousPage: page > 1,
    };
  }

  async toggleLike(userId: string, bookId: string) {
    const book = await this.databaseService.book.findUnique({
      where: { id: bookId, isActive: true },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const existingLike = await this.databaseService.like.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    if (existingLike) {
      await this.databaseService.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return { message: 'Like removed' };
    } else {
      await this.databaseService.like.create({
        data: {
          userId,
          bookId,
        },
      });
      return { message: 'Like added' };
    }
  }
}

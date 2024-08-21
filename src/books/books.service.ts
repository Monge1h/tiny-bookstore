import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { paginateResult } from 'src/shared/utils/pagination.utils';
import { QueryParamsDto } from 'src/shared/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(private readonly databaseService: DatabaseService) {}

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
            { categories: { some: { id: categoryId } } },
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
      where: { id: bookId },
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

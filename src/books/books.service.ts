import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { paginateResult } from 'src/shared/utils/pagination.utils';
import { QueryParamsDto } from 'src/shared/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(private readonly databaseService: DatabaseService) {}

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
      categories: book.categories.map((category) => category.name),
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

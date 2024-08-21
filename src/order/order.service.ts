import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { QueryParamsDto } from 'src/shared/dto/pagination.dto';
import { paginateResult } from 'src/shared/utils/pagination.utils';

@Injectable()
export class OrderService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createOrder(userId: string) {
    const cartItems = await this.databaseService.cartItem.findMany({
      where: { userId },
      include: {
        book: true,
      },
    });

    if (cartItems.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    const total = cartItems.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    const order = await this.databaseService.order.create({
      data: {
        userId,
        total,
        status: 'Pending',
        items: {
          create: cartItems.map((item) => ({
            bookId: item.bookId,
            quantity: item.quantity,
            price: item.book.price,
          })),
        },
      },
    });

    await this.databaseService.cartItem.deleteMany({
      where: { userId },
    });

    return order;
  }

  async getUserOrders(userId: string, { page, limit }: QueryParamsDto) {
    const offset = (page - 1) * limit;

    const [count, orders] = await Promise.all([
      this.databaseService.order.count({
        where: { userId },
      }),
      this.databaseService.order.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        include: {
          items: {
            include: {
              book: {
                select: {
                  title: true,
                  author: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return paginateResult(count, orders, limit, page);
  }
}

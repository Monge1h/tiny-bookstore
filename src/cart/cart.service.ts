import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CartService {
  constructor(private readonly databaseService: DatabaseService) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { bookId, quantity } = addToCartDto;

    const book = await this.databaseService.book.findUnique({
      where: { id: bookId, isActive: true },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.type === 'PHYSICAL') {
      const existingCartItem = await this.databaseService.cartItem.findUnique({
        where: {
          userId_bookId: {
            userId,
            bookId,
          },
        },
      });

      const totalQuantityRequested = existingCartItem
        ? existingCartItem.quantity + quantity
        : quantity;

      if (book.stock < totalQuantityRequested) {
        throw new BadRequestException('Not enough stock available');
      }
    }

    const existingCartItem = await this.databaseService.cartItem.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    if (existingCartItem) {
      return this.databaseService.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
    } else {
      return this.databaseService.cartItem.create({
        data: {
          userId,
          bookId,
          quantity,
        },
      });
    }
  }

  async getCart(userId: string) {
    const cartItems = await this.databaseService.cartItem.findMany({
      where: { userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            price: true,
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
        },
      },
    });

    if (cartItems.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    const totalPrice = cartItems.reduce((total, cartItem) => {
      return total + cartItem.book.price * cartItem.quantity;
    }, 0);

    return {
      items: cartItems.map((item) => ({
        id: item.id,
        bookId: item.book.id,
        title: item.book.title,
        author: item.book.author,
        price: item.book.price,
        quantity: item.quantity,
        totalItemPrice: item.book.price * item.quantity,
        image:
          item.book.images.length > 0 ? item.book.images[0].imageUrl : null,
      })),
      totalPrice,
    };
  }
}

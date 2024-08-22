import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { DatabaseService } from 'src/database/database.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';

describe('CartService', () => {
  let service: CartService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: DatabaseService,
          useValue: {
            book: {
              findUnique: jest.fn(),
            },
            cartItem: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  describe('addToCart', () => {
    it('should throw NotFoundException if the book is not found', async () => {
      const userId = 'user-id';
      const addToCartDto: AddToCartDto = { bookId: 'book-id', quantity: 1 };

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(null);

      await expect(service.addToCart(userId, addToCartDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if not enough stock is available', async () => {
      const userId = 'user-id';
      const addToCartDto: AddToCartDto = { bookId: 'book-id', quantity: 10 };
      const book = {
        id: 'book-id',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 20,
        stock: 5,
        fileUrl: 'http://example.com/file.pdf',
        type: 'PHYSICAL' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(book);
      const existingCartItem = {
        id: 'cart-item-id',
        userId: 'user-id',
        bookId: 'book-id',
        quantity: 2,
        createdAt: new Date(),
      };

      jest
        .spyOn(databaseService.cartItem, 'findUnique')
        .mockResolvedValue(existingCartItem);

      await expect(service.addToCart(userId, addToCartDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update the quantity of an existing cart item', async () => {
      const userId = 'user-id';
      const addToCartDto: AddToCartDto = { bookId: 'book-id', quantity: 2 };
      const book = {
        id: 'book-id',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 20,
        stock: 10,
        fileUrl: 'http://example.com/file.pdf',
        type: 'PHYSICAL' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const existingCartItem = {
        id: 'cart-item-id',
        userId: 'user-id',
        bookId: 'book-id',
        quantity: 3,
        createdAt: new Date(),
      };

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(book);
      jest
        .spyOn(databaseService.cartItem, 'findUnique')
        .mockResolvedValue(existingCartItem);
      jest
        .spyOn(databaseService.cartItem, 'update')
        .mockResolvedValue({ ...existingCartItem, quantity: 5 });

      const result = await service.addToCart(userId, addToCartDto);

      expect(databaseService.cartItem.update).toHaveBeenCalledWith({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + addToCartDto.quantity },
      });
      expect(result).toEqual({
        ...existingCartItem,
        quantity: existingCartItem.quantity + addToCartDto.quantity,
      });
    });

    it('should create a new cart item if it does not exist', async () => {
      const userId = 'user-id';
      const addToCartDto: AddToCartDto = { bookId: 'book-id', quantity: 2 };
      const book = {
        id: 'book-id',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 20,
        stock: 10,
        fileUrl: 'http://example.com/file.pdf',
        type: 'PHYSICAL' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(book);
      jest
        .spyOn(databaseService.cartItem, 'findUnique')
        .mockResolvedValue(null);

      const newCartItem = {
        id: 'new-cart-item-id',
        userId: userId,
        bookId: addToCartDto.bookId,
        quantity: addToCartDto.quantity,
        createdAt: new Date(),
      };

      jest
        .spyOn(databaseService.cartItem, 'create')
        .mockResolvedValue(newCartItem);

      const result = await service.addToCart(userId, addToCartDto);

      expect(databaseService.cartItem.create).toHaveBeenCalledWith({
        data: {
          userId,
          bookId: addToCartDto.bookId,
          quantity: addToCartDto.quantity,
        },
      });
      expect(result).toEqual(newCartItem);
    });
  });

  describe('getCart', () => {
    it('should throw NotFoundException if the cart is empty', async () => {
      const userId = 'user-id';

      jest.spyOn(databaseService.cartItem, 'findMany').mockResolvedValue([]);

      await expect(service.getCart(userId)).rejects.toThrow(NotFoundException);
    });

    it('should return cart items with total price', async () => {
      const userId = 'user-id';
      const cartItems = [
        {
          id: 'cart-item-id',
          userId: userId,
          bookId: 'book-id',
          quantity: 2,
          createdAt: new Date(),
          book: {
            id: 'book-id',
            title: 'Book Title',
            author: 'Author',
            price: 100,
            images: [{ imageUrl: 'image-url', isPrimary: true }],
          },
        },
      ];

      jest
        .spyOn(databaseService.cartItem, 'findMany')
        .mockResolvedValue(cartItems);

      const result = await service.getCart(userId);

      expect(databaseService.cartItem.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual({
        items: [
          {
            id: 'cart-item-id',
            bookId: 'book-id',
            title: 'Book Title',
            author: 'Author',
            price: 100,
            quantity: 2,
            totalItemPrice: 200,
            image: 'image-url',
          },
        ],
        totalPrice: 200,
      });
    });
  });
});

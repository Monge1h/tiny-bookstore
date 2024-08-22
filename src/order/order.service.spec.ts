import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { DatabaseService } from 'src/database/database.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginateResult } from 'src/shared/utils/pagination.utils';

describe('OrderService', () => {
  let service: OrderService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: DatabaseService,
          useValue: {
            cartItem: {
              findMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            order: {
              create: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  describe('createOrder', () => {
    it('should create an order and clear the cart', async () => {
      const userId = 'user-id';
      const cartItems = [
        {
          id: 'cart-item-id',
          userId: userId,
          bookId: 'book-id',
          quantity: 2,
          createdAt: new Date(),
          book: { price: 100 },
        },
      ];

      jest
        .spyOn(databaseService.cartItem, 'findMany')
        .mockResolvedValue(cartItems);

      const order = {
        id: 'order-id',
        userId: userId,
        total: 200,
        createdAt: new Date(),
        status: 'Pending',
        items: [
          {
            bookId: 'book-id',
            quantity: 2,
            price: 100,
          },
        ],
      };

      jest.spyOn(databaseService.order, 'create').mockResolvedValue(order);

      const result = await service.createOrder(userId);

      expect(databaseService.cartItem.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { book: true },
      });
      expect(databaseService.order.create).toHaveBeenCalledWith({
        data: {
          userId,
          total: 200,
          status: 'Pending',
          items: {
            create: [
              {
                bookId: 'book-id',
                quantity: 2,
                price: 100,
              },
            ],
          },
        },
      });
      expect(databaseService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException if the cart is empty', async () => {
      const userId = 'user-id';

      jest.spyOn(databaseService.cartItem, 'findMany').mockResolvedValue([]);

      await expect(service.createOrder(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserOrders', () => {
    it('should return paginated user orders', async () => {
      const userId = 'user-id';
      const queryParams = { page: 1, limit: 10 };
      const orders = [
        {
          id: 'order-id',
          userId: userId,
          total: 200,
          createdAt: new Date(),
          status: 'Pending',
          items: [
            {
              book: { title: 'Book Title', author: 'Author' },
            },
          ],
        },
      ];

      jest.spyOn(databaseService.order, 'count').mockResolvedValue(1);
      jest.spyOn(databaseService.order, 'findMany').mockResolvedValue(orders);

      const result = await service.getUserOrders(userId, queryParams);

      expect(databaseService.order.count).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(databaseService.order.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 10,
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
      });
      expect(result).toEqual(paginateResult(1, orders, 10, 1));
    });
  });

  describe('getAllOrders', () => {
    it('should return paginated orders with search', async () => {
      const queryParams = { page: 1, limit: 10, search: 'test' };
      const orders = [
        {
          id: 'order-id',
          userId: 'user-id',
          total: 200,
          createdAt: new Date(),
          status: 'Pending',
          user: {
            id: 'user-id',
            email: 'test@example.com',
            firstName: 'First',
            lastName: 'Last',
          },
          items: [
            {
              book: { title: 'Book Title', author: 'Author' },
            },
          ],
        },
      ];

      const searchCondition: Prisma.OrderWhereInput = {
        OR: [
          {
            user: {
              email: { contains: 'test', mode: Prisma.QueryMode.insensitive },
            },
          },
          {
            user: {
              firstName: {
                contains: 'test',
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
          {
            user: {
              lastName: {
                contains: 'test',
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        ],
      };

      jest.spyOn(databaseService.order, 'count').mockResolvedValue(1);
      jest.spyOn(databaseService.order, 'findMany').mockResolvedValue(orders);

      const result = await service.getAllOrders(queryParams);

      expect(databaseService.order.count).toHaveBeenCalledWith({
        where: searchCondition,
      });
      expect(databaseService.order.findMany).toHaveBeenCalledWith({
        where: searchCondition,
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
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
      });
      expect(result).toEqual(paginateResult(1, orders, 10, 1));
    });
  });
});

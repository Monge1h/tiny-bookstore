import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { DatabaseService } from 'src/database/database.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FileType, UploadFileDto } from './dto/upload-file.dto';
import { Prisma } from '@prisma/client';
import { QueryParamsDto } from 'src/shared/dto/pagination.dto';

describe('BooksService', () => {
  let service: BooksService;
  let databaseService: DatabaseService;
  let cloudinaryService: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: DatabaseService,
          useValue: {
            book: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
            bookImage: {
              create: jest.fn(),
            },
            category: {
              findUnique: jest.fn(),
            },
            like: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('createBook', () => {
    it('should create a new book', async () => {
      const createBookDto: CreateBookDto = {
        title: 'New Book',
        author: 'Author Name',
        description: 'Book description',
        price: 20,
        stock: 100,
        type: 'PHYSICAL',
        fileUrl: 'http://example.com/book.pdf',
      };

      jest
        .spyOn(databaseService.book, 'create')
        .mockResolvedValue(createBookDto as any);

      const result = await service.createBook(createBookDto);

      expect(databaseService.book.create).toHaveBeenCalledWith({
        data: createBookDto,
      });
      expect(result).toEqual(createBookDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated books with search conditions', async () => {
      const queryParams: QueryParamsDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };
      const books = [
        {
          id: 'book-id',
          title: 'Test Book',
          author: 'Test Author',
          description: 'Test Description',
          price: 20,
          stock: 100,
          type: 'PHYSICAL' as const,
          isActive: true,
          fileUrl: 'http://example.com/book.pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
          categories: [{ id: 1, name: 'Category 1' }],
          _count: { likes: 5 },
          images: [
            { imageUrl: 'http://example.com/image.jpg', isPrimary: true },
          ],
        },
      ];

      jest.spyOn(databaseService.book, 'count').mockResolvedValue(1);
      jest.spyOn(databaseService.book, 'findMany').mockResolvedValue(books);

      const result = await service.findAll(queryParams);

      expect(databaseService.book.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { title: { contains: 'test', mode: Prisma.QueryMode.insensitive } },
            {
              author: { contains: 'test', mode: Prisma.QueryMode.insensitive },
            },
            {
              description: {
                contains: 'test',
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        },
      });

      expect(databaseService.book.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { title: { contains: 'test', mode: Prisma.QueryMode.insensitive } },
            {
              author: { contains: 'test', mode: Prisma.QueryMode.insensitive },
            },
            {
              description: {
                contains: 'test',
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        },
        skip: 0,
        take: 10,
        include: {
          categories: {
            select: { id: true, name: true },
          },
          _count: {
            select: { likes: true },
          },
          images: {
            select: { imageUrl: true, isPrimary: true },
            orderBy: { isPrimary: 'desc' },
            take: 1,
          },
        },
      });

      expect(result).toEqual({
        totalRecords: 1,
        results: [
          {
            id: 'book-id',
            title: 'Test Book',
            author: 'Test Author',
            description: 'Test Description',
            price: 20,
            stock: 100,
            type: 'PHYSICAL',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            image: 'http://example.com/image.jpg',
            likesCount: 5,
            categories: [{ id: 'category-id', name: 'Category 1' }],
          },
        ],
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single book by ID', async () => {
      const bookId = 'book-id';
      const book = {
        id: 'book-id',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 20,
        stock: 100,
        type: 'PHYSICAL' as const,
        isActive: true,
        fileUrl: 'http://example.com/book.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [{ id: 1, name: 'Category 1' }],
        _count: { likes: 5 },
        images: [{ imageUrl: 'http://example.com/image.jpg', isPrimary: true }],
      };

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(book);

      const result = await service.findOne(bookId);

      expect(databaseService.book.findUnique).toHaveBeenCalledWith({
        where: { id: bookId },
        include: {
          categories: {
            select: { name: true },
          },
          _count: {
            select: { likes: true },
          },
          images: {
            select: { imageUrl: true, isPrimary: true },
            orderBy: { isPrimary: 'desc' },
            take: 1,
          },
        },
      });

      expect(result).toEqual({
        id: bookId,
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 20,
        stock: 100,
        type: 'PHYSICAL',
        image: 'http://example.com/image.jpg',
        likesCount: 5,
        categories: ['Category 1'],
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      });
    });

    it('should throw NotFoundException if book is not found', async () => {
      const bookId = 'non-existing-book-id';

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(bookId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBook', () => {
    it('should update an existing book', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
        author: 'Updated Author',
        description: 'Updated description',
      };
      const bookId = 'book-id';

      jest
        .spyOn(databaseService.book, 'findUnique')
        .mockResolvedValue({ id: bookId, author: 'Old Author' } as any);
      jest
        .spyOn(databaseService.book, 'update')
        .mockResolvedValue({ ...updateBookDto, id: bookId } as any);

      const result = await service.updateBook(bookId, updateBookDto);

      expect(databaseService.book.update).toHaveBeenCalledWith({
        where: { id: bookId },
        data: updateBookDto,
      });
      expect(result).toEqual({ ...updateBookDto, id: bookId });
    });

    it('should throw NotFoundException if the book does not exist', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
        author: 'Updated Author',
        description: 'Updated description',
      };
      const bookId = 'book-id';

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(null);

      await expect(service.updateBook(bookId, updateBookDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteBook', () => {
    it('should delete an existing book', async () => {
      const bookId = 'book-id';

      jest
        .spyOn(databaseService.book, 'findUnique')
        .mockResolvedValue({ id: bookId } as any);
      jest
        .spyOn(databaseService.book, 'delete')
        .mockResolvedValue({ id: bookId } as any);

      const result = await service.deleteBook(bookId);

      expect(databaseService.book.delete).toHaveBeenCalledWith({
        where: { id: bookId },
      });
      expect(result).toEqual({ message: 'Book deleted successfully' });
    });

    it('should throw NotFoundException if the book does not exist', async () => {
      const bookId = 'book-id';

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteBook(bookId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('searchBooksByCategory', () => {
    it('should return books filtered by category and search term', async () => {
      const categoryId = 'category-id';
      const queryParams: QueryParamsDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };
      const books = [
        {
          id: 'book-id',
          title: 'Test Book',
          author: 'Test Author',
          description: 'Test Description',
          price: 20,
          stock: 100,
          type: 'PHYSICAL' as const,
          isActive: true,
          fileUrl: 'http://example.com/book.pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
          categories: [{ id: categoryId, name: 'Category 1' }],
          _count: { likes: 5 },
          images: [
            { imageUrl: 'http://example.com/image.jpg', isPrimary: true },
          ],
        },
      ];

      jest.spyOn(databaseService.category, 'findUnique').mockResolvedValue({
        id: categoryId,
        name: 'Category 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(databaseService.book, 'count').mockResolvedValue(1);
      jest.spyOn(databaseService.book, 'findMany').mockResolvedValue(books);

      const result = await service.searchBooksByCategory(
        categoryId,
        queryParams,
      );

      expect(databaseService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });

      expect(databaseService.book.count).toHaveBeenCalledWith({
        where: {
          AND: [
            { categories: { some: { id: categoryId } }, isActive: true },
            {
              OR: [
                {
                  title: {
                    contains: 'test',
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  author: {
                    contains: 'test',
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  description: {
                    contains: 'test',
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            },
          ],
        },
      });

      expect(databaseService.book.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { categories: { some: { id: categoryId } }, isActive: true },
            {
              OR: [
                {
                  title: {
                    contains: 'test',
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  author: {
                    contains: 'test',
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  description: {
                    contains: 'test',
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            },
          ],
        },
        skip: 0,
        take: 10,
        include: {
          categories: { select: { id: true, name: true } },
          _count: { select: { likes: true } },
          images: {
            select: { imageUrl: true, isPrimary: true },
            orderBy: { isPrimary: 'desc' },
            take: 1,
          },
        },
      });

      expect(result).toEqual({
        results: [
          {
            id: 'book-id',
            title: 'Test Book',
            author: 'Test Author',
            description: 'Test Description',
            price: 20,
            stock: 100,
            type: 'PHYSICAL',
            image: 'http://example.com/image.jpg',
            likesCount: 5,
            categories: [{ id: categoryId, name: 'Category 1' }],
          },
        ],
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should throw NotFoundException if category is not found', async () => {
      const categoryId = 'non-existing-category-id';
      const queryParams: QueryParamsDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      jest
        .spyOn(databaseService.category, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.searchBooksByCategory(categoryId, queryParams),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadFile', () => {
    it('should upload an image file and associate it with a book', async () => {
      const bookId = 'book-id';
      const file: Express.Multer.File = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        fieldname: '',
        encoding: '',
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };
      const uploadFileDto: UploadFileDto = { fileType: FileType.IMAGE };

      jest.spyOn(service, 'findOne').mockResolvedValue({ id: bookId } as any);
      jest.spyOn(cloudinaryService, 'uploadFile').mockResolvedValue({
        secure_url: 'http://example.com/image.jpg',
      } as any);

      const result = await service.uploadFile(bookId, file, uploadFileDto);

      expect(databaseService.bookImage.create).toHaveBeenCalledWith({
        data: {
          bookId,
          imageUrl: 'http://example.com/image.jpg',
          isPrimary: false,
        },
      });
      expect(result).toEqual({
        message: 'File uploaded successfully',
        url: 'http://example.com/image.jpg',
      });
    });

    it('should upload a PDF file and update the book', async () => {
      const bookId = 'book-id';
      const file: Express.Multer.File = {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1000,
        fieldname: '',
        encoding: '',
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };
      const uploadFileDto: UploadFileDto = { fileType: FileType.PDF };

      jest.spyOn(service, 'findOne').mockResolvedValue({ id: bookId } as any);
      jest.spyOn(cloudinaryService, 'uploadFile').mockResolvedValue({
        secure_url: 'http://example.com/file.pdf',
      } as any);

      const result = await service.uploadFile(bookId, file, uploadFileDto);

      expect(databaseService.book.update).toHaveBeenCalledWith({
        where: { id: bookId },
        data: { fileUrl: 'http://example.com/file.pdf' },
      });
      expect(result).toEqual({
        message: 'File uploaded successfully',
        url: 'http://example.com/file.pdf',
      });
    });
  });

  describe('toggleLike', () => {
    it('should add a like if it does not exist', async () => {
      const userId = 'user-id';
      const bookId = 'book-id';

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue({
        id: bookId,
        isActive: true,
        author: 'Author',
        title: 'Title',
        description: 'Description',
        price: 20,
        stock: 100,
        type: 'PHYSICAL',
        fileUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(databaseService.like, 'findUnique').mockResolvedValue(null);
      jest.spyOn(databaseService.like, 'create').mockResolvedValue({
        id: 'like-id',
        userId,
        bookId,
        createdAt: new Date(),
      });

      const result = await service.toggleLike(userId, bookId);

      expect(databaseService.book.findUnique).toHaveBeenCalledWith({
        where: { id: bookId, isActive: true },
      });
      expect(databaseService.like.findUnique).toHaveBeenCalledWith({
        where: { userId_bookId: { userId, bookId } },
      });
      expect(databaseService.like.create).toHaveBeenCalledWith({
        data: { userId, bookId },
      });
      expect(result).toEqual({ message: 'Like added' });
    });

    it('should remove an existing like', async () => {
      const userId = 'user-id';
      const bookId = 'book-id';
      const existingLike = {
        id: 'like-id',
        userId,
        bookId,
        createdAt: new Date(),
      };

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue({
        id: bookId,
        isActive: true,
        author: 'Author',
        title: 'Title',
        description: 'Description',
        price: 20,
        stock: 100,
        type: 'PHYSICAL',
        fileUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest
        .spyOn(databaseService.like, 'findUnique')
        .mockResolvedValue(existingLike);
      jest
        .spyOn(databaseService.like, 'delete')
        .mockResolvedValue(existingLike);

      const result = await service.toggleLike(userId, bookId);

      expect(databaseService.book.findUnique).toHaveBeenCalledWith({
        where: { id: bookId, isActive: true },
      });
      expect(databaseService.like.findUnique).toHaveBeenCalledWith({
        where: { userId_bookId: { userId, bookId } },
      });
      expect(databaseService.like.delete).toHaveBeenCalledWith({
        where: { id: existingLike.id },
      });
      expect(result).toEqual({ message: 'Like removed' });
    });

    it('should throw NotFoundException if book is not found or inactive', async () => {
      const userId = 'user-id';
      const bookId = 'book-id';

      jest.spyOn(databaseService.book, 'findUnique').mockResolvedValue(null);

      await expect(service.toggleLike(userId, bookId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

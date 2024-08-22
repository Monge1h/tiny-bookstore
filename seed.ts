import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Crear un usuario con el rol de CLIENT
  const clientPasswordHash = await bcrypt.hash('password123', 10);
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@example.com',
      password: clientPasswordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'CLIENT',
    },
  });

  // Crear un usuario con el rol de MANAGER
  const managerPasswordHash = await bcrypt.hash('manager123', 10);
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password: managerPasswordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'MANAGER',
    },
  });

  // Crear algunos libros
  const books = await prisma.book.createMany({
    data: [
      {
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt',
        description: 'A guide to mastering the craft of software development.',
        price: 29.99,
        stock: 10,
        type: 'PHYSICAL',
      },
      {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        description: 'A handbook of agile software craftsmanship.',
        price: 24.99,
        stock: 15,
        type: 'PHYSICAL',
      },
      {
        title: 'Refactoring',
        author: 'Martin Fowler',
        description: 'Improving the design of existing code.',
        price: 34.99,
        stock: 5,
        type: 'PHYSICAL',
      },
      {
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        description: 'Unearthing the excellence in JavaScript.',
        price: 19.99,
        type: 'DIGITAL',
        fileUrl: 'https://example.com/js-good-parts.pdf',
      },
    ],
  });

  console.log({ clientUser, managerUser, books });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

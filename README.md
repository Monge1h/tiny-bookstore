# Tiny Bookstore API

This is a backend API for a tiny bookstore built with NestJS, Prisma, and PostgreSQL. The API supports basic e-commerce functionality, including user authentication, product management, shopping cart operations, and order management.

## Features

- **User Authentication**
  - Sign up, log in, and log out
  - Role-based access control (Client, Manager)
  - JWT authentication with session management

- **Product Management**
  - Create, update, delete, and disable books (for Managers)
  - View all books with pagination and search functionality
  - View book details
  - Upload book images or digital files (e.g., PDFs)

- **Shopping Cart**
  - Add books to cart
  - View cart with detailed product information

- **Order Management**
  - Create an order from the shopping cart
  - View user orders with pagination
  - Managers can view all orders, with search and pagination

- **Likes**
  - Users can like or unlike books (toggle functionality)

## Technology Stack

- **Backend Framework**: [NestJS](https://nestjs.com/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary (for image and PDF uploads)
- **Testing**: Jest
- **API Documentation**: Swagger

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- PostgreSQL
- Cloudinary account for file storage

### Installation

1. Clone the repository:
  ```bash
  git clone https://github.com/monge1h/tiny-bookstore.git
  cd tiny-bookstore
  ```

2. Install dependencies:

```
npm install
```

3. Set up the environment variables:
Create a .env file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database_name?schema=public
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. Set up the database:
Run Prisma migrations to set up the database schema:

```
npx prisma migrate dev --name init
```

5. Seed the database (optional):
You can seed the database with some initial data by running:

```
npm run seed
```

6. Start the development server:

```
npm run start:dev
```


7. Running Tests
To run the tests, use the following command:

```
npm run test
```

8. API Documentation
 The API documentation is available via Swagger. Once the server is running, you can access the documentation at:

```
http://localhost:3000/docs
```

## Usage
- Sign Up: Create a new user account.
- Log In: Authenticate with your credentials to receive a JWT.
- View Products: Browse through the list of available books.
- Manage Products: Managers can create, update, delete, and disable books.
- Add to Cart: Add books to your cart before placing an order.
- Place Order: Create an order from your cart's contents.
- Like Books: Like or unlike books.
- Deployment

To deploy this project, you will need to:

Set up a PostgreSQL database and Cloudinary account in your production environment.

Set the environment variables accordingly.

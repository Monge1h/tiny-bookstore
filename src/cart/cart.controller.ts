import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Add a book to the user's cart" })
  @ApiBody({
    type: AddToCartDto,
    description: 'Details of the book to add to the cart',
  })
  @ApiResponse({
    status: 201,
    description: 'Book successfully added to the cart.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @Post()
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get the current user's cart" })
  @ApiResponse({ status: 200, description: "The user's cart is returned." })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @Get()
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }
}

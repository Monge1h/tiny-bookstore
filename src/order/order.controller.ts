import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { QueryParamsDto } from 'src/shared/dto/pagination.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new order for the logged-in user' })
  @ApiResponse({ status: 201, description: 'Order successfully created.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @Post()
  async createOrder(@Request() req) {
    return this.orderService.createOrder(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get orders for the logged-in user with pagination',
  })
  @ApiQuery({
    name: 'page',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: String,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'List of user orders.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @Get()
  async getUserOrders(@Request() req, @Query() params: QueryParamsDto) {
    return this.orderService.getUserOrders(req.user.id, { ...params });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @Get('manager')
  @ApiOperation({ summary: 'Get all orders with pagination (Manager only)' })
  @ApiQuery({
    name: 'page',
    type: String,
    required: false,
    description: 'The page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    type: String,
    required: false,
    description: 'The number of items per page',
  })
  @ApiResponse({ status: 200, description: 'List of all orders.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({
    description: 'Forbidden. Only managers can access this endpoint.',
  })
  async getAllOrders(@Query() params: QueryParamsDto) {
    return this.orderService.getAllOrders({ ...params });
  }
}

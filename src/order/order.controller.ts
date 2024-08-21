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
import { QueryParamsDto } from 'src/shared/dto/pagination.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Request() req) {
    return this.orderService.createOrder(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
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
  @Get()
  async getUserOrders(@Request() req, @Query() params: QueryParamsDto) {
    return this.orderService.getUserOrders(req.user.id, { ...params });
  }
}

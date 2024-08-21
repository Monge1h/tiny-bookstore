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
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @Get('manager')
  async getAllOrders(@Query() params: QueryParamsDto) {
    return this.orderService.getAllOrders({ ...params });
  }
}

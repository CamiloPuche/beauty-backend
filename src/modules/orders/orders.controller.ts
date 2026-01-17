import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { OrdersService, PaginatedOrders } from './orders.service';
import { CreateOrderDto, QueryOrderDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/types';
import { OrderDocument } from './schemas/order.schema';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new order' })
    @ApiResponse({ status: 201, description: 'Order created successfully' })
    @ApiResponse({ status: 400, description: 'Validation error or insufficient stock' })
    async create(
        @CurrentUser() user: { userId: string },
        @Body() dto: CreateOrderDto,
    ): Promise<OrderDocument> {
        return this.ordersService.create(user.userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List my orders' })
    @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
    async findMyOrders(
        @CurrentUser() user: { userId: string },
        @Query() query: QueryOrderDto,
    ): Promise<PaginatedOrders> {
        return this.ordersService.findByUser(user.userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    @ApiResponse({ status: 200, description: 'Order found' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 403, description: 'Cannot view orders from other users' })
    async findOne(
        @Param('id') id: string,
        @CurrentUser() user: { userId: string; role: UserRole },
    ): Promise<OrderDocument> {
        return this.ordersService.findByIdForUser(id, user.userId, user.role);
    }
}

@ApiTags('Orders (Admin)')
@ApiBearerAuth('JWT-auth')
@Controller('admin/orders')
export class AdminOrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'List all orders (Admin only)' })
    @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
    async findAll(@Query() query: QueryOrderDto): Promise<PaginatedOrders> {
        return this.ordersService.findAll(query);
    }
}

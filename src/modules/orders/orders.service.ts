import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto, QueryOrderDto } from './dto';
import { ProductsService } from '../products/products.service';
import { UserRole } from '../../common/types';

export interface PaginatedOrders {
    data: OrderDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private productsService: ProductsService,
    ) { }

    async create(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
        const items = [];
        let total = 0;

        // Validate products and calculate totals
        for (const item of dto.items) {
            const product = await this.productsService.findByIdOrFail(item.productId);

            if (!product.isActive) {
                throw new BadRequestException(`Product ${product.name} is not available`);
            }

            if (product.stock < item.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for ${product.name}. Available: ${product.stock}`,
                );
            }

            const subtotal = product.price * item.quantity;
            items.push({
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
                subtotal,
            });
            total += subtotal;
        }

        const order = new this.orderModel({
            user: userId,
            items,
            total: Math.round(total * 100) / 100,
            status: OrderStatus.CREATED,
        });

        return order.save();
    }

    async findById(id: string): Promise<OrderDocument | null> {
        return this.orderModel.findById(id).exec();
    }

    async findByIdOrFail(id: string): Promise<OrderDocument> {
        const order = await this.findById(id);
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        return order;
    }

    async findByIdForUser(id: string, userId: string, userRole: UserRole): Promise<OrderDocument> {
        const order = await this.findByIdOrFail(id);

        if (userRole !== UserRole.ADMIN && order.user.toString() !== userId) {
            throw new ForbiddenException('You can only view your own orders');
        }

        return order;
    }

    async findByUser(userId: string, query: QueryOrderDto): Promise<PaginatedOrders> {
        const { status, page = 1, limit = 10 } = query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { user: userId };

        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.orderModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.orderModel.countDocuments(filter).exec(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findAll(query: QueryOrderDto): Promise<PaginatedOrders> {
        const { status, page = 1, limit = 10 } = query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.orderModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.orderModel.countDocuments(filter).exec(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findByTransactionId(transactionId: string): Promise<OrderDocument | null> {
        return this.orderModel.findOne({ transactionId }).exec();
    }

    async updateStatus(
        id: string,
        status: OrderStatus,
        additionalData?: Partial<Order>,
    ): Promise<OrderDocument> {
        const order = await this.orderModel
            .findByIdAndUpdate(
                id,
                { $set: { status, ...additionalData } },
                { new: true },
            )
            .exec();

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return order;
    }

    async setPaymentPending(id: string, transactionId: string): Promise<OrderDocument> {
        return this.updateStatus(id, OrderStatus.PAYMENT_PENDING, { transactionId });
    }

    async markAsPaid(
        id: string,
        receiptKey?: string,
        receiptUrl?: string,
    ): Promise<OrderDocument> {
        return this.updateStatus(id, OrderStatus.PAID, {
            paidAt: new Date(),
            receiptKey,
            receiptUrl,
        });
    }

    async markAsFailed(id: string, reason: string): Promise<OrderDocument> {
        return this.updateStatus(id, OrderStatus.FAILED, { failedReason: reason });
    }
}

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersService } from './orders.service';
import { OrdersController, AdminOrdersController } from './orders.controller';
import { ProductsModule } from '../products/products.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
        forwardRef(() => ProductsModule),
    ],
    controllers: [OrdersController, AdminOrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }

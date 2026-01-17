import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
    CREATED = 'CREATED',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    CANCELED = 'CANCELED',
}

@Schema({ _id: false })
export class OrderItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    product: Types.ObjectId;

    @Prop({ required: true })
    productName: string;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    unitPrice: number;

    @Prop({ required: true, min: 0 })
    subtotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({
    timestamps: true,
    toJSON: {
        transform: (_doc: unknown, ret: Record<string, unknown>) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
})
export class Order {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: Types.ObjectId;

    @Prop({ type: [OrderItemSchema], required: true })
    items: OrderItem[];

    @Prop({ required: true, min: 0 })
    total: number;

    @Prop({ default: 'USD' })
    currency: string;

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.CREATED, index: true })
    status: OrderStatus;

    @Prop({ index: true })
    transactionId: string;

    @Prop()
    receiptKey: string;

    @Prop()
    receiptUrl: string;

    @Prop()
    paidAt: Date;

    @Prop()
    failedReason: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ user: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });

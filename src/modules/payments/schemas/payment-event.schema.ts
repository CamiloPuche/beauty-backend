import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentEventDocument = HydratedDocument<PaymentEvent>;

@Schema({
    timestamps: true,
})
export class PaymentEvent {
    _id: Types.ObjectId;

    @Prop({ required: true, unique: true, index: true })
    eventId: string;

    @Prop({ required: true, index: true })
    transactionId: string;

    @Prop({ required: true })
    eventType: string;

    @Prop({ type: Object })
    payload: Record<string, unknown>;

    @Prop({ default: false })
    processed: boolean;

    @Prop()
    processedAt: Date;

    @Prop()
    error: string;
}

export const PaymentEventSchema = SchemaFactory.createForClass(PaymentEvent);

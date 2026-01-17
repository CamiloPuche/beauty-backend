import {
    Injectable,
    BadRequestException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentEvent, PaymentEventDocument } from './schemas/payment-event.schema';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/schemas/order.schema';
import { WebhookPayloadDto } from './dto';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

export interface PaymentIntent {
    transactionId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    webhookUrl: string;
    mockPaymentUrl: string;
}

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly webhookSecret: string;

    constructor(
        @InjectModel(PaymentEvent.name) private paymentEventModel: Model<PaymentEventDocument>,
        private ordersService: OrdersService,
        private storageService: StorageService,
        private notificationsService: NotificationsService,
        private usersService: UsersService,
        private configService: ConfigService,
    ) {
        this.webhookSecret = this.configService.get<string>('webhook.secret') || 'webhook-secret';
    }

    async initiatePayment(orderId: string, userId: string): Promise<PaymentIntent> {
        const order = await this.ordersService.findByIdOrFail(orderId);

        // Verify order belongs to user
        if (order.user.toString() !== userId) {
            throw new BadRequestException('Order does not belong to current user');
        }

        // Verify order is in correct state
        if (order.status !== OrderStatus.CREATED) {
            throw new BadRequestException(`Cannot pay order with status ${order.status}`);
        }

        // Generate transaction ID
        const transactionId = `txn_${crypto.randomUUID().replace(/-/g, '')}`;

        // Update order status
        await this.ordersService.setPaymentPending(orderId, transactionId);

        this.logger.log(`Payment initiated for order ${orderId} with transaction ${transactionId}`);

        return {
            transactionId,
            orderId,
            amount: order.total,
            currency: order.currency,
            status: 'pending',
            webhookUrl: '/payments/webhook',
            mockPaymentUrl: `/payments/mock/${transactionId}`,
        };
    }

    validateWebhookSignature(payload: string, signature: string): boolean {
        if (!signature) {
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        const providedSig = signature.replace('sha256=', '');

        try {
            return crypto.timingSafeEqual(
                Buffer.from(providedSig, 'hex'),
                Buffer.from(expectedSignature, 'hex'),
            );
        } catch {
            return false;
        }
    }

    generateWebhookSignature(payload: string): string {
        const signature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');
        return `sha256=${signature}`;
    }

    async processWebhook(dto: WebhookPayloadDto, signature: string, rawBody: string): Promise<{ success: boolean; message: string }> {
        // Validate signature
        if (!this.validateWebhookSignature(rawBody, signature)) {
            throw new UnauthorizedException('Invalid webhook signature');
        }

        // Check idempotency - has this event been processed?
        const existingEvent = await this.paymentEventModel.findOne({ eventId: dto.eventId }).exec();

        if (existingEvent) {
            this.logger.log(`Event ${dto.eventId} already processed, skipping`);
            return { success: true, message: 'Event already processed' };
        }

        // Create event record (for idempotency)
        const event = new this.paymentEventModel({
            eventId: dto.eventId,
            transactionId: dto.transactionId,
            eventType: dto.eventType,
            payload: dto.data || {},
            processed: false,
        });

        try {
            await event.save();
        } catch (error) {
            // Duplicate key error - another request is processing this event
            if ((error as { code?: number }).code === 11000) {
                this.logger.log(`Event ${dto.eventId} being processed by another request`);
                return { success: true, message: 'Event already being processed' };
            }
            throw error;
        }

        // Find order by transaction ID
        const order = await this.ordersService.findByTransactionId(dto.transactionId);

        if (!order) {
            this.logger.error(`Order not found for transaction ${dto.transactionId}`);
            await this.paymentEventModel.updateOne(
                { eventId: dto.eventId },
                { $set: { processed: true, error: 'Order not found' } },
            );
            return { success: false, message: 'Order not found' };
        }

        // Process based on event type
        try {
            if (dto.eventType === 'payment.success') {
                await this.handlePaymentSuccess(order.id, dto);
            } else if (dto.eventType === 'payment.failed') {
                await this.handlePaymentFailed(order.id, dto);
            }

            // Mark event as processed
            await this.paymentEventModel.updateOne(
                { eventId: dto.eventId },
                { $set: { processed: true, processedAt: new Date() } },
            );

            return { success: true, message: 'Event processed successfully' };
        } catch (error) {
            this.logger.error(`Error processing event ${dto.eventId}: ${(error as Error).message}`);
            await this.paymentEventModel.updateOne(
                { eventId: dto.eventId },
                { $set: { processed: true, error: (error as Error).message } },
            );
            throw error;
        }
    }

    private async handlePaymentSuccess(orderId: string, dto: WebhookPayloadDto): Promise<void> {
        const order = await this.ordersService.findByIdOrFail(orderId);

        // Upload receipt to S3
        let receiptKey: string | undefined;
        let receiptUrl: string | undefined;

        try {
            const receipt = {
                orderId: order.id,
                transactionId: dto.transactionId,
                amount: order.total,
                currency: order.currency,
                items: order.items,
                paidAt: new Date().toISOString(),
                status: 'PAID',
            };

            const result = await this.storageService.uploadReceipt(order.id, receipt);
            receiptKey = result.key;
            receiptUrl = result.url;
            this.logger.log(`Receipt uploaded for order ${orderId}: ${receiptKey}`);
        } catch (error) {
            this.logger.error(`Failed to upload receipt for order ${orderId}: ${(error as Error).message}`);
            // Continue - receipt upload failure should not block payment confirmation
        }

        // Mark order as paid
        await this.ordersService.markAsPaid(orderId, receiptKey, receiptUrl);

        // Send confirmation email (async, tolerant to failures)
        this.sendConfirmationEmail(orderId).catch((error) => {
            this.logger.error(`Failed to send confirmation email for order ${orderId}: ${error.message}`);
        });

        this.logger.log(`Order ${orderId} marked as paid`);
    }

    private async handlePaymentFailed(orderId: string, dto: WebhookPayloadDto): Promise<void> {
        const reason = (dto.data?.error as string) || 'Payment failed';
        await this.ordersService.markAsFailed(orderId, reason);
        this.logger.log(`Order ${orderId} marked as failed: ${reason}`);
    }

    private async sendConfirmationEmail(orderId: string): Promise<void> {
        const order = await this.ordersService.findByIdOrFail(orderId);
        const user = await this.usersService.findByIdOrFail(order.user.toString());

        await this.notificationsService.sendOrderConfirmation(order, user);
    }

    // Mock payment endpoint for testing
    async simulatePayment(
        transactionId: string,
        success: boolean,
    ): Promise<WebhookPayloadDto> {
        const eventId = `evt_${crypto.randomUUID().replace(/-/g, '')}`;;

        return {
            eventId,
            transactionId,
            eventType: success ? 'payment.success' : 'payment.failed',
            data: success ? { amount: 0 } : { error: 'Card declined' },
        };
    }
}

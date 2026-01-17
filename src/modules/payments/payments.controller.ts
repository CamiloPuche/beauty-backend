import {
    Controller,
    Post,
    Param,
    Body,
    Headers,
    Req,
    HttpCode,
    HttpStatus,
    Get,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiHeader,
} from '@nestjs/swagger';
import { PaymentsService, PaymentIntent } from './payments.service';
import { WebhookPayloadDto } from './dto';
import { Public, CurrentUser } from '../../common/decorators';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('orders/:id/pay')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Initiate payment for an order' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    @ApiResponse({ status: 200, description: 'Payment initiated' })
    @ApiResponse({ status: 400, description: 'Invalid order state' })
    async initiatePayment(
        @Param('id') orderId: string,
        @CurrentUser() user: { userId: string },
    ): Promise<PaymentIntent> {
        return this.paymentsService.initiatePayment(orderId, user.userId);
    }

    @Public()
    @Post('payments/webhook')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Webhook endpoint for payment gateway' })
    @ApiHeader({ name: 'x-webhook-signature', description: 'HMAC signature of the payload' })
    @ApiResponse({ status: 200, description: 'Webhook processed' })
    @ApiResponse({ status: 401, description: 'Invalid signature' })
    async handleWebhook(
        @Body() dto: WebhookPayloadDto,
        @Headers('x-webhook-signature') signature: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        @Req() req: any,
    ): Promise<{ success: boolean; message: string }> {
        const rawBody = req.rawBody?.toString() || JSON.stringify(dto);
        return this.paymentsService.processWebhook(dto, signature, rawBody);
    }

    // Mock endpoints for testing
    @Public()
    @Get('payments/mock/:transactionId/success')
    @ApiOperation({ summary: '[Mock] Simulate successful payment' })
    @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
    async mockPaymentSuccess(
        @Param('transactionId') transactionId: string,
    ): Promise<{ message: string; webhook: WebhookPayloadDto; signature: string }> {
        const webhook = await this.paymentsService.simulatePayment(transactionId, true);
        const signature = this.paymentsService.generateWebhookSignature(JSON.stringify(webhook));

        return {
            message: 'Use this payload to call POST /payments/webhook',
            webhook,
            signature,
        };
    }

    @Public()
    @Get('payments/mock/:transactionId/fail')
    @ApiOperation({ summary: '[Mock] Simulate failed payment' })
    @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
    async mockPaymentFail(
        @Param('transactionId') transactionId: string,
    ): Promise<{ message: string; webhook: WebhookPayloadDto; signature: string }> {
        const webhook = await this.paymentsService.simulatePayment(transactionId, false);
        const signature = this.paymentsService.generateWebhookSignature(JSON.stringify(webhook));

        return {
            message: 'Use this payload to call POST /payments/webhook',
            webhook,
            signature,
        };
    }
}

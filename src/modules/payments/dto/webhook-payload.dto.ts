import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsObject, IsOptional } from 'class-validator';

export class WebhookPayloadDto {
    @ApiProperty({ example: 'evt_123456', description: 'Unique event ID' })
    @IsString()
    @IsNotEmpty()
    eventId: string;

    @ApiProperty({ example: 'txn_123456', description: 'Transaction ID' })
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @ApiProperty({
        example: 'payment.success',
        enum: ['payment.success', 'payment.failed'],
        description: 'Event type',
    })
    @IsString()
    @IsIn(['payment.success', 'payment.failed'])
    eventType: string;

    @ApiProperty({ example: { amount: 100, currency: 'USD' }, required: false })
    @IsObject()
    @IsOptional()
    data?: Record<string, unknown>;
}

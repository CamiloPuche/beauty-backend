import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsMongoId,
    IsNumber,
    Min,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';

export class OrderItemDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Product ID' })
    @IsMongoId()
    productId: string;

    @ApiProperty({ example: 2, description: 'Quantity to purchase' })
    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty({
        type: [OrderItemDto],
        description: 'List of products to order',
        example: [{ productId: '507f1f77bcf86cd799439011', quantity: 2 }],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    Min,
    IsNotEmpty,
    IsUrl,
    MaxLength,
} from 'class-validator';

export class CreateProductDto {
    @ApiProperty({ example: 'Lipstick Matte Red', description: 'Product name' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @ApiPropertyOptional({ example: 'Long-lasting matte lipstick', description: 'Product description' })
    @IsString()
    @IsOptional()
    @MaxLength(2000)
    description?: string;

    @ApiProperty({ example: 29.99, description: 'Product price (must be >= 0)' })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ example: 'USD', description: 'Currency code', default: 'USD' })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiProperty({ example: 100, description: 'Available stock (must be >= 0)' })
    @IsNumber()
    @Min(0)
    stock: number;

    @ApiPropertyOptional({ example: 'Makeup', description: 'Product category' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    category?: string;

    @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Product image URL' })
    @IsUrl()
    @IsOptional()
    imageUrl?: string;
}

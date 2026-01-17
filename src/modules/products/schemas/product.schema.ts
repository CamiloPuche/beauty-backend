import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ProductDocument = HydratedDocument<Product>;

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
export class Product {
    _id: Types.ObjectId;

    @ApiProperty({ example: 'Lipstick Matte Red', description: 'Product name' })
    @Prop({ required: true, trim: true })
    name: string;

    @ApiProperty({ example: 'Long-lasting matte lipstick in vibrant red', description: 'Product description' })
    @Prop({ trim: true })
    description: string;

    @ApiProperty({ example: 29.99, description: 'Product price' })
    @Prop({ required: true, min: 0 })
    price: number;

    @ApiProperty({ example: 'USD', description: 'Currency code' })
    @Prop({ default: 'USD', uppercase: true })
    currency: string;

    @ApiProperty({ example: 100, description: 'Available stock' })
    @Prop({ required: true, min: 0, default: 0 })
    stock: number;

    @ApiProperty({ example: true, description: 'Whether the product is active' })
    @Prop({ default: true })
    isActive: boolean;

    @ApiProperty({ example: 'Makeup', description: 'Product category' })
    @Prop({ trim: true })
    category: string;

    @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Product image URL' })
    @Prop()
    imageUrl: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1, price: 1 });

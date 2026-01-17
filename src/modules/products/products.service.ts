import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async create(dto: CreateProductDto): Promise<ProductDocument> {
        const product = new this.productModel(dto);
        return product.save();
    }

    async findAll(query: QueryProductDto): Promise<PaginatedResult<ProductDocument>> {
        const { search, category, minPrice, maxPrice, isActive, page = 1, limit = 10 } = query;

        // Build filter object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        // Text search
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Category filter
        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        // Price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = minPrice;
            if (maxPrice !== undefined) filter.price.$lte = maxPrice;
        }

        // Active status
        if (isActive !== undefined) {
            filter.isActive = isActive;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.productModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.productModel.countDocuments(filter).exec(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findActiveProducts(query: QueryProductDto): Promise<PaginatedResult<ProductDocument>> {
        return this.findAll({ ...query, isActive: true });
    }

    async findById(id: string): Promise<ProductDocument | null> {
        return this.productModel.findById(id).exec();
    }

    async findByIdOrFail(id: string): Promise<ProductDocument> {
        const product = await this.findById(id);
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
        const product = await this.productModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
            .exec();

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async softDelete(id: string): Promise<ProductDocument> {
        return this.update(id, { isActive: false });
    }

    async delete(id: string): Promise<void> {
        const result = await this.productModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
    }

    async checkStock(id: string, quantity: number): Promise<boolean> {
        const product = await this.findByIdOrFail(id);
        return product.stock >= quantity;
    }

    async decreaseStock(id: string, quantity: number): Promise<ProductDocument> {
        const product = await this.findByIdOrFail(id);

        if (product.stock < quantity) {
            throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }

        product.stock -= quantity;
        return product.save();
    }

    async increaseStock(id: string, quantity: number): Promise<ProductDocument> {
        const product = await this.findByIdOrFail(id);
        product.stock += quantity;
        return product.save();
    }
}

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { ProductsService, PaginatedResult } from './products.service';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';
import { Public, Roles } from '../../common/decorators';
import { UserRole } from '../../common/types';
import { ProductDocument } from './schemas/product.schema';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all active products (public)' })
    @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
    async findAll(@Query() query: QueryProductDto): Promise<PaginatedResult<ProductDocument>> {
        return this.productsService.findActiveProducts(query);
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID (public)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({ status: 200, description: 'Product found' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async findOne(@Param('id') id: string): Promise<ProductDocument> {
        return this.productsService.findByIdOrFail(id);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a new product (ADMIN only)' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async create(@Body() dto: CreateProductDto): Promise<ProductDocument> {
        return this.productsService.create(dto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update a product (ADMIN only)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({ status: 200, description: 'Product updated successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateProductDto,
    ): Promise<ProductDocument> {
        return this.productsService.update(id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Soft delete a product (ADMIN only)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({ status: 204, description: 'Product deactivated successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async remove(@Param('id') id: string): Promise<void> {
        await this.productsService.softDelete(id);
    }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  productListQuerySchema,
  type ProductDetail,
  type ProductListResponse,
} from '@ziarnista/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ProductDetailDto } from './dto/product-detail.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { ProductListResponseDto } from './dto/product-list.dto';
import { PRODUCT_NOT_FOUND_MESSAGE, ProductsService } from './products.service';

@ApiTags('catalog')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista produktów: filtry, sortowanie, paginacja i fasety',
    description: 'Tylko produkty ACTIVE z co najmniej jednym aktywnym wariantem.',
  })
  @ApiOkResponse({ type: ProductListResponseDto })
  @ApiBadRequestResponse({ description: 'Nieprawidłowe parametry zapytania' })
  list(
    @Query(new ZodValidationPipe(productListQuerySchema)) query: ProductListQueryDto,
  ): Promise<ProductListResponse> {
    return this.products.list(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Szczegóły produktu z aktywnymi wariantami, zdjęciami i ścieżką kategorii',
  })
  @ApiParam({ name: 'slug', example: 'etiopia-guji-hambela' })
  @ApiOkResponse({ type: ProductDetailDto })
  @ApiNotFoundResponse({ description: `${PRODUCT_NOT_FOUND_MESSAGE} (także szkic lub archiwum)` })
  findOne(@Param('slug') slug: string): Promise<ProductDetail> {
    return this.products.findBySlug(slug);
  }
}

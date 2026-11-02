import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  adminProductListQuerySchema,
  createProductSchema,
  createVariantSchema,
  updateProductSchema,
  updateVariantSchema,
  type AdminProductDetail,
  type AdminProductListResponse,
} from '@ziarnista/shared';
import { AdminAuth } from '../../auth/decorators/auth.decorator';
import { PRODUCT_NOT_FOUND_MESSAGE } from '../../catalog/products.service';
import { ParseIdPipe } from '../../common/parse-id.pipe';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AdminProductsService } from './admin-products.service';
import { AdminProductDetailDto, AdminProductListResponseDto } from './dto/admin-product.dto';
import {
  AdminProductListQueryDto,
  CreateProductDto,
  CreateVariantDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto/product-input.dto';
import { PRODUCT_SLUG_TAKEN_MESSAGE, SKU_TAKEN_MESSAGE } from './product-errors';
import { ProductVariantsService, VARIANT_NOT_FOUND_MESSAGE } from './product-variants.service';
import { LAST_ACTIVE_VARIANT_MESSAGE, PUBLISH_BLOCKED_MESSAGE } from './publication-rules';

@ApiTags('admin-products')
@AdminAuth()
@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly products: AdminProductsService,
    private readonly variants: ProductVariantsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista produktów we wszystkich statusach: wyszukiwanie, filtry, sortowanie',
  })
  @ApiOkResponse({ type: AdminProductListResponseDto })
  @ApiBadRequestResponse({ description: 'Nieprawidłowe parametry zapytania' })
  list(
    @Query(new ZodValidationPipe(adminProductListQuerySchema)) query: AdminProductListQueryDto,
  ): Promise<AdminProductListResponse> {
    return this.products.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pełne dane produktu do formularza edycji, także nieaktywne warianty' })
  @ApiOkResponse({ type: AdminProductDetailDto })
  @ApiNotFoundResponse({ description: PRODUCT_NOT_FOUND_MESSAGE })
  findOne(@Param('id', ParseIdPipe) id: string): Promise<AdminProductDetail> {
    return this.products.findById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Nowy produkt z wariantami (jedna transakcja); zawsze jako szkic (DRAFT)',
  })
  @ApiCreatedResponse({ type: AdminProductDetailDto })
  @ApiBadRequestResponse({
    description: 'Nieprawidłowe dane, np. kawa bez pochodzenia; nieistniejąca kategoria',
  })
  @ApiConflictResponse({
    description: `${PRODUCT_SLUG_TAKEN_MESSAGE}; ${SKU_TAKEN_MESSAGE} (errors wskazuje warianty)`,
  })
  create(
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductDto,
  ): Promise<AdminProductDetail> {
    return this.products.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Zmiana danych produktu, w tym statusu i slugu' })
  @ApiOkResponse({ type: AdminProductDetailDto })
  @ApiBadRequestResponse({
    description: `Nieprawidłowe dane; ${PUBLISH_BLOCKED_MESSAGE} (errors: brak aktywnego wariantu / zdjęcia)`,
  })
  @ApiNotFoundResponse({ description: PRODUCT_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({ description: PRODUCT_SLUG_TAKEN_MESSAGE })
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductDto,
  ): Promise<AdminProductDetail> {
    return this.products.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archiwizacja (status ARCHIVED), bez usuwania; idempotentna' })
  @ApiNoContentResponse({ description: 'Produkt zarchiwizowany' })
  @ApiNotFoundResponse({ description: PRODUCT_NOT_FOUND_MESSAGE })
  archive(@Param('id', ParseIdPipe) id: string): Promise<void> {
    return this.products.archive(id);
  }

  @Post(':id/variants')
  @ApiOperation({ summary: 'Nowy wariant; odpowiedź to cały produkt (z przeliczonym minPrice)' })
  @ApiCreatedResponse({ type: AdminProductDetailDto })
  @ApiNotFoundResponse({ description: PRODUCT_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({ description: SKU_TAKEN_MESSAGE })
  createVariant(
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(createVariantSchema)) body: CreateVariantDto,
  ): Promise<AdminProductDetail> {
    return this.variants.create(id, body);
  }

  @Patch(':id/variants/:variantId')
  @ApiOperation({
    summary: 'Zmiana wariantu, w tym wyłączenie (isActive); odpowiedź to cały produkt',
  })
  @ApiOkResponse({ type: AdminProductDetailDto })
  @ApiBadRequestResponse({ description: LAST_ACTIVE_VARIANT_MESSAGE })
  @ApiNotFoundResponse({
    description: `${PRODUCT_NOT_FOUND_MESSAGE}; ${VARIANT_NOT_FOUND_MESSAGE}`,
  })
  @ApiConflictResponse({ description: SKU_TAKEN_MESSAGE })
  updateVariant(
    @Param('id', ParseIdPipe) id: string,
    @Param('variantId', ParseIdPipe) variantId: string,
    @Body(new ZodValidationPipe(updateVariantSchema)) body: UpdateVariantDto,
  ): Promise<AdminProductDetail> {
    return this.variants.update(id, variantId, body);
  }
}

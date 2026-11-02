import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  IMAGE_ALT_MAX_LENGTH,
  IMAGE_MAX_DIMENSION,
  reorderImagesSchema,
  updateImageSchema,
  uploadImageSchema,
  type AdminProductDetail,
} from '@ziarnista/shared';
import { AdminAuth } from '../../../auth/decorators/auth.decorator';
import { PRODUCT_NOT_FOUND_MESSAGE } from '../../../catalog/products.service';
import { ParseIdPipe } from '../../../common/parse-id.pipe';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { AdminProductDetailDto } from '../dto/admin-product.dto';
import { ReorderImagesDto, UpdateImageDto, UploadImageDto } from './dto/image-input.dto';
import { UNSUPPORTED_IMAGE_MESSAGE } from './image-processor';
import {
  FILE_TOO_LARGE_MESSAGE,
  IMAGE_FIELD,
  ImageUploadInterceptor,
} from './image-upload.interceptor';
import {
  IMAGE_NOT_FOUND_MESSAGE,
  IMAGE_ORDER_MISMATCH_MESSAGE,
  LAST_IMAGE_MESSAGE,
  ProductImagesService,
  TOO_MANY_IMAGES_MESSAGE,
} from './product-images.service';

@ApiTags('admin-images')
@AdminAuth()
@Controller('admin')
export class ProductImagesController {
  constructor(private readonly images: ProductImagesService) {}

  @Post('products/:id/images')
  @UseInterceptors(ImageUploadInterceptor)
  @ApiOperation({
    summary: 'Dodanie zdjęcia (multipart); odpowiedź to cały produkt',
    description:
      `JPEG, PNG lub WebP do 5 MB (typ sprawdzany po zawartości pliku). Zapisywane jako WebP, ` +
      `dłuższy bok najwyżej ${IMAGE_MAX_DIMENSION} px, bez metadanych EXIF, pod losową nazwą. ` +
      'Zdjęcie trafia na koniec kolejności.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [IMAGE_FIELD, 'alt'],
      properties: {
        [IMAGE_FIELD]: { type: 'string', format: 'binary' },
        alt: { type: 'string', maxLength: IMAGE_ALT_MAX_LENGTH },
      },
    },
  })
  @ApiCreatedResponse({ type: AdminProductDetailDto })
  @ApiBadRequestResponse({ description: `Brak pliku lub alt; ${UNSUPPORTED_IMAGE_MESSAGE}` })
  @ApiNotFoundResponse({ description: PRODUCT_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({ description: TOO_MANY_IMAGES_MESSAGE })
  @ApiPayloadTooLargeResponse({ description: FILE_TOO_LARGE_MESSAGE })
  upload(
    @Param('id', ParseIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body(new ZodValidationPipe(uploadImageSchema)) body: UploadImageDto,
  ): Promise<AdminProductDetail> {
    return this.images.upload(id, file, body);
  }

  @Patch('products/:id/images/order')
  @ApiOperation({ summary: 'Nowa kolejność zdjęć produktu; odpowiedź to cały produkt' })
  @ApiOkResponse({ type: AdminProductDetailDto })
  @ApiBadRequestResponse({ description: IMAGE_ORDER_MISMATCH_MESSAGE })
  @ApiNotFoundResponse({ description: PRODUCT_NOT_FOUND_MESSAGE })
  reorder(
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(reorderImagesSchema)) body: ReorderImagesDto,
  ): Promise<AdminProductDetail> {
    return this.images.reorder(id, body);
  }

  @Patch('images/:id')
  @ApiOperation({ summary: 'Zmiana tekstu alternatywnego; odpowiedź to cały produkt' })
  @ApiOkResponse({ type: AdminProductDetailDto })
  @ApiNotFoundResponse({ description: IMAGE_NOT_FOUND_MESSAGE })
  updateAlt(
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(updateImageSchema)) body: UpdateImageDto,
  ): Promise<AdminProductDetail> {
    return this.images.updateAlt(id, body);
  }

  @Delete('images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Usunięcie zdjęcia z bazy i ze storage; pozostałe zachowują kolejność' })
  @ApiNoContentResponse({ description: 'Zdjęcie usunięte' })
  @ApiBadRequestResponse({ description: LAST_IMAGE_MESSAGE })
  @ApiNotFoundResponse({ description: IMAGE_NOT_FOUND_MESSAGE })
  remove(@Param('id', ParseIdPipe) id: string): Promise<void> {
    return this.images.remove(id);
  }
}

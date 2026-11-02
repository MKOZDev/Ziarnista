import { ApiProperty } from '@nestjs/swagger';
import {
  IMAGE_ALT_MAX_LENGTH,
  PRODUCT_MAX_IMAGES,
  type ReorderImagesInput,
  type UpdateImageInput,
  type UploadImageInput,
} from '@ziarnista/shared';

// Swagger description only; validation is done by the Zod schemas in @ziarnista/shared

export class UploadImageDto implements UploadImageInput {
  @ApiProperty({
    maxLength: IMAGE_ALT_MAX_LENGTH,
    example: 'Opakowanie kawy Etiopia Guji Hambela',
    description: 'Tekst alternatywny (wymagany)',
  })
  alt: string;
}

export class UpdateImageDto implements UpdateImageInput {
  @ApiProperty({ maxLength: IMAGE_ALT_MAX_LENGTH })
  alt: string;
}

export class ReorderImagesDto implements ReorderImagesInput {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    maxItems: PRODUCT_MAX_IMAGES,
    description: 'Wszystkie zdjęcia produktu, każde dokładnie raz, w nowej kolejności',
  })
  imageIds: string[];
}

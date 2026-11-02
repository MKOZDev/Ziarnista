import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  PRODUCT_MAX_IMAGES,
  type AdminProductDetail,
  type ReorderImagesInput,
  type UpdateImageInput,
  type UploadImageInput,
} from '@ziarnista/shared';
import { PRODUCT_NOT_FOUND_MESSAGE } from '../../../catalog/products.service';
import { isPrismaError, PrismaErrorCode } from '../../../common/prisma-errors';
import { validationError } from '../../../common/validation-error';
import type { Prisma } from '../../../generated/prisma/client';
import { ProductStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../storage/storage.service';
import { AdminProductsService } from '../admin-products.service';
import { lockProduct } from '../product-lock';
import { IMAGE_FIELD } from './image-upload.interceptor';
import { processProductImage, UnsupportedImageError } from './image-processor';

export const IMAGE_NOT_FOUND_MESSAGE = 'Nie znaleziono zdjęcia';
export const TOO_MANY_IMAGES_MESSAGE = `Produkt może mieć najwyżej ${PRODUCT_MAX_IMAGES} zdjęć. Usuń któreś, zanim dodasz nowe.`;
export const LAST_IMAGE_MESSAGE =
  'Nie można usunąć ostatniego zdjęcia opublikowanego produktu. Najpierw zmień status na szkic.';
export const IMAGE_ORDER_MISMATCH_MESSAGE =
  'Lista musi zawierać każde zdjęcie produktu dokładnie raz';

/** Keys are random and never reused, so a stored file never changes: cache it for a year */
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';

/**
 * Database and bucket have no shared transaction. The order of the steps makes the only
 * possible inconsistency an orphaned file (harmless, found by `pnpm storage:orphans`),
 * never a row pointing to a missing file (a broken image in the shop):
 * - upload: file first, then the row; if the row fails, the file is deleted again
 * - delete: row first (committed), then the file
 */
@Injectable()
export class ProductImagesService {
  private readonly logger = new Logger(ProductImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly products: AdminProductsService,
  ) {}

  async upload(
    productId: string,
    file: Express.Multer.File | undefined,
    input: UploadImageInput,
  ): Promise<AdminProductDetail> {
    if (!file) {
      throw validationError([{ path: IMAGE_FIELD, message: 'Dodaj plik zdjęcia' }]);
    }
    // Cheap checks before the CPU and network work; repeated under the lock below
    await this.assertRoomForImage(this.prisma, productId);

    const image = await processProductImage(file.buffer).catch((error: unknown) => {
      throw error instanceof UnsupportedImageError
        ? validationError([{ path: IMAGE_FIELD, message: error.message }])
        : error;
    });
    const storageKey = `products/${productId}/${randomUUID()}.webp`;
    await this.storage.put(storageKey, image.data, {
      contentType: 'image/webp',
      cacheControl: IMMUTABLE_CACHE,
    });

    try {
      await this.prisma.$transaction(async (tx) => {
        // The lock serializes uploads of one product: two of them could otherwise take the
        // same position or both pass the limit check
        await lockProduct(tx, productId);
        await this.assertRoomForImage(tx, productId);
        const last = await tx.productImage.aggregate({
          where: { productId },
          _max: { position: true },
        });
        await tx.productImage.create({
          data: {
            productId,
            storageKey,
            alt: input.alt,
            width: image.width,
            height: image.height,
            position: (last._max.position ?? -1) + 1,
          },
        });
      });
    } catch (error) {
      // Compensation: without its row the file would be an orphan
      await this.deleteFile(storageKey);
      throw error;
    }
    return this.products.findById(productId);
  }

  /** imageIds: every image of the product exactly once; positions become 0..n-1 */
  async reorder(productId: string, input: ReorderImagesInput): Promise<AdminProductDetail> {
    await this.prisma.$transaction(async (tx) => {
      await lockProduct(tx, productId);
      const current = await tx.productImage.findMany({
        where: { productId },
        select: { id: true },
      });
      const currentIds = new Set(current.map((image) => image.id));
      const sameSet =
        input.imageIds.length === currentIds.size &&
        input.imageIds.every((id) => currentIds.has(id));
      if (!sameSet) {
        throw validationError([{ path: 'imageIds', message: IMAGE_ORDER_MISMATCH_MESSAGE }]);
      }
      // At most 12 rows; positions are not unique, so no temporary values are needed
      for (const [position, id] of input.imageIds.entries()) {
        await tx.productImage.update({ where: { id }, data: { position } });
      }
    });
    return this.products.findById(productId);
  }

  async updateAlt(imageId: string, input: UpdateImageInput): Promise<AdminProductDetail> {
    try {
      const { productId } = await this.prisma.productImage.update({
        where: { id: imageId },
        data: { alt: input.alt },
        select: { productId: true },
      });
      return await this.products.findById(productId);
    } catch (error) {
      throw isPrismaError(error, PrismaErrorCode.RecordNotFound)
        ? new NotFoundException(IMAGE_NOT_FOUND_MESSAGE)
        : error;
    }
  }

  /**
   * The row goes first, in a transaction with the publication rule and the renumbering;
   * the file only after the commit. A failed file delete leaves an orphan and a warning.
   */
  async remove(imageId: string): Promise<void> {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      select: { productId: true },
    });
    if (!image) {
      throw new NotFoundException(IMAGE_NOT_FOUND_MESSAGE);
    }
    const storageKey = await this.prisma.$transaction(async (tx) => {
      const { status } = await lockProduct(tx, image.productId);
      // Read again under the lock: a concurrent request may have deleted it meanwhile
      const images = await tx.productImage.findMany({
        where: { productId: image.productId },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: { id: true, storageKey: true },
      });
      const deleted = images.find((candidate) => candidate.id === imageId);
      if (!deleted) {
        throw new NotFoundException(IMAGE_NOT_FOUND_MESSAGE);
      }
      if (status === ProductStatus.ACTIVE && images.length === 1) {
        throw validationError(
          [{ path: 'images', message: LAST_IMAGE_MESSAGE }],
          LAST_IMAGE_MESSAGE,
        );
      }
      await tx.productImage.delete({ where: { id: imageId } });
      // Close the gap, so positions stay 0..n-1
      const remaining = images.filter((candidate) => candidate.id !== imageId);
      for (const [position, { id }] of remaining.entries()) {
        await tx.productImage.update({ where: { id }, data: { position } });
      }
      return deleted.storageKey;
    });
    await this.deleteFile(storageKey);
  }

  /** 404 for a missing product, 409 at the image limit */
  private async assertRoomForImage(db: Prisma.TransactionClient, productId: string): Promise<void> {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { _count: { select: { images: true } } },
    });
    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_MESSAGE);
    }
    if (product._count.images >= PRODUCT_MAX_IMAGES) {
      throw new ConflictException(TOO_MANY_IMAGES_MESSAGE);
    }
  }

  /** Best effort: a failure leaves an orphan for `pnpm storage:orphans`, never an error */
  private async deleteFile(storageKey: string): Promise<void> {
    try {
      await this.storage.delete(storageKey);
    } catch (error) {
      this.logger.warn(
        `Could not delete ${storageKey} from storage (orphaned file): ${String(error)}`,
      );
    }
  }
}

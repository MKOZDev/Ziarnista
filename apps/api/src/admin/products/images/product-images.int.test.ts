import { IMAGE_MAX_FILE_SIZE, type AdminProductDetail } from '@ziarnista/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCategory, createOrigin, createProduct } from '../../../../test/catalog-fixtures';
import { fixtureJpeg, solidImage } from '../../../../test/images';
import {
  ADMIN_ORIGIN,
  adminSessionCookie,
  createTestApp,
  createUser,
  resetDatabase,
  type TestApp,
} from '../../../../test/test-app';
import { testImageUrl } from '../../../../test/test-storage';
import { UNSUPPORTED_IMAGE_MESSAGE } from './image-processor';
import { FILE_TOO_LARGE_MESSAGE } from './image-upload.interceptor';
import {
  IMAGE_ORDER_MISMATCH_MESSAGE,
  LAST_IMAGE_MESSAGE,
  TOO_MANY_IMAGES_MESSAGE,
} from './product-images.service';

const MISSING_ID = '01923456-789a-7bcd-8ef0-123456789abc';

describe('admin product images', () => {
  let t: TestApp;
  let cookie: string;
  let categoryId: string;
  let originId: string;

  beforeEach(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    const admin = await createUser(t.prisma, {
      email: 'admin@example.com',
      password: 'haslo-admina-123',
      role: 'ADMIN',
    });
    cookie = await adminSessionCookie(t.prisma, admin.id);
    categoryId = await createCategory(t.prisma, 'kawa', 'Kawa');
    originId = await createOrigin(t.prisma, 'etiopia', 'Etiopia');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await t.app.close();
  });

  function product(overrides: { status?: 'DRAFT' | 'ACTIVE'; images?: string[] } = {}) {
    return createProduct(t.prisma, {
      slug: 'etiopia-guji',
      name: 'Etiopia Guji',
      categoryId,
      originId,
      status: overrides.status ?? 'DRAFT',
      variants: [{ price: 4900 }],
      images: overrides.images,
    });
  }

  function upload(
    productId: string,
    file: Buffer,
    { filename = 'kawa.jpg', contentType = 'image/jpeg', alt = 'Opakowanie kawy' } = {},
  ) {
    return request(t.server)
      .post(`/api/v1/admin/products/${productId}/images`)
      .set('Cookie', cookie)
      .set('Origin', ADMIN_ORIGIN)
      .field('alt', alt)
      .attach('file', file, { filename, contentType });
  }

  const reorder = (productId: string, imageIds: string[]) =>
    request(t.server)
      .patch(`/api/v1/admin/products/${productId}/images/order`)
      .set('Cookie', cookie)
      .set('Origin', ADMIN_ORIGIN)
      .send({ imageIds });
  const updateAlt = (imageId: string, alt: string) =>
    request(t.server)
      .patch(`/api/v1/admin/images/${imageId}`)
      .set('Cookie', cookie)
      .set('Origin', ADMIN_ORIGIN)
      .send({ alt });
  const remove = (imageId: string) =>
    request(t.server)
      .delete(`/api/v1/admin/images/${imageId}`)
      .set('Cookie', cookie)
      .set('Origin', ADMIN_ORIGIN);

  const storedKeys = async (productId: string) =>
    (await t.storage.list(`products/${productId}/`)).map((object) => object.key);

  async function uploadOk(productId: string, alt = 'Opakowanie kawy'): Promise<AdminProductDetail> {
    const response = await upload(productId, fixtureJpeg(), { alt }).expect(201);
    return response.body as AdminProductDetail;
  }

  describe('POST /admin/products/:id/images', () => {
    it('stores a WebP of at most 1600 px under a random name, publicly readable', async () => {
      const id = await product();

      const body = await uploadOk(id, '  Opakowanie kawy Etiopia Guji  ');

      const [image] = body.images;
      expect(image).toMatchObject({
        alt: 'Opakowanie kawy Etiopia Guji',
        width: 1600,
        height: 1067,
        position: 0,
      });
      const keys = await storedKeys(id);
      expect(keys).toHaveLength(1);
      // Random name: the original "kawa.jpg" is not used
      expect(keys[0]).toMatch(new RegExp(`^products/${id}/[0-9a-f-]{36}\\.webp$`));
      expect(image?.url).toBe(testImageUrl(keys[0] ?? ''));

      // Anonymous read through the public URL (bucket policy), with long-term caching
      const file = await fetch(image?.url ?? '');
      expect(file.status).toBe(200);
      expect(file.headers.get('content-type')).toBe('image/webp');
      expect(file.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    });

    it('appends images at the end', async () => {
      const id = await product();
      await uploadOk(id, 'pierwsze');

      const body = await uploadOk(id, 'drugie');

      expect(body.images.map((image) => [image.alt, image.position])).toEqual([
        ['pierwsze', 0],
        ['drugie', 1],
      ]);
    });

    it('trusts the content, not the name: a PNG named .jpg is accepted', async () => {
      const id = await product();

      const response = await upload(id, await solidImage(800, 600, 'png'), {
        filename: 'zdjecie.jpg',
        contentType: 'image/jpeg',
      }).expect(201);

      expect((response.body as AdminProductDetail).images[0]).toMatchObject({
        width: 800,
        height: 600,
      });
    });

    it('rejects a text file pretending to be a JPEG (forged extension and type)', async () => {
      const id = await product();

      const response = await upload(id, Buffer.from('<?php echo "nie zdjęcie"; ?>'), {
        filename: 'zdjecie.jpg',
        contentType: 'image/jpeg',
      }).expect(400);

      expect(response.body).toMatchObject({
        errors: [{ path: 'file', message: UNSUPPORTED_IMAGE_MESSAGE }],
      });
      expect(await storedKeys(id)).toEqual([]);
      expect(await t.prisma.productImage.count()).toBe(0);
    });

    it('rejects an image in a format that is not accepted (GIF)', async () => {
      const id = await product();

      await upload(id, await solidImage(10, 10, 'gif'), {
        filename: 'anim.gif',
        contentType: 'image/gif',
      }).expect(400);
    });

    it('rejects a file over 5 MB with 413 before reading it as an image', async () => {
      const id = await product();
      // A valid JPEG start followed by padding: the size alone must decide
      const tooLarge = Buffer.concat([fixtureJpeg(), Buffer.alloc(IMAGE_MAX_FILE_SIZE)]);

      const response = await upload(id, tooLarge).expect(413);

      expect(response.body).toMatchObject({ message: FILE_TOO_LARGE_MESSAGE });
      expect(await storedKeys(id)).toEqual([]);
    });

    it('requires the file and the alt text', async () => {
      const id = await product();

      const noAlt = await upload(id, fixtureJpeg(), { alt: '   ' }).expect(400);
      const noFile = await request(t.server)
        .post(`/api/v1/admin/products/${id}/images`)
        .set('Cookie', cookie)
        .set('Origin', ADMIN_ORIGIN)
        .field('alt', 'Opakowanie')
        .expect(400);
      const wrongField = await request(t.server)
        .post(`/api/v1/admin/products/${id}/images`)
        .set('Cookie', cookie)
        .set('Origin', ADMIN_ORIGIN)
        .field('alt', 'Opakowanie')
        .attach('image', fixtureJpeg(), 'kawa.jpg')
        .expect(400);

      expect(noAlt.body).toMatchObject({ errors: [{ path: 'alt' }] });
      expect(noFile.body).toMatchObject({ errors: [{ path: 'file' }] });
      expect(wrongField.body).toMatchObject({ errors: [{ path: 'file' }] });
      expect(await storedKeys(id)).toEqual([]);
    });

    it('returns 404 for a missing product without storing anything', async () => {
      // The bucket holds files of earlier tests in this run; nothing may be added
      const before = (await t.storage.list('products/')).length;

      await upload(MISSING_ID, fixtureJpeg()).expect(404);

      expect(await t.storage.list('products/')).toHaveLength(before);
    });

    it('returns 409 at 12 images', async () => {
      const id = await product({
        images: Array.from({ length: 12 }, (_, index) => `products/x/${index}.webp`),
      });

      const response = await upload(id, fixtureJpeg()).expect(409);

      expect(response.body).toMatchObject({ message: TOO_MANY_IMAGES_MESSAGE });
      expect(await storedKeys(id)).toEqual([]);
    });

    it('keeps the limit under concurrent uploads and removes the rejected file', async () => {
      const id = await product({
        images: Array.from({ length: 11 }, (_, index) => `products/x/${index}.webp`),
      });

      // Both pass the early check; the product lock lets only one insert
      const statuses = await Promise.all([
        upload(id, fixtureJpeg()).then((response) => response.status),
        upload(id, fixtureJpeg()).then((response) => response.status),
      ]);

      expect(statuses.sort()).toEqual([201, 409]);
      expect(await t.prisma.productImage.count({ where: { productId: id } })).toBe(12);
      // The loser's file was deleted again (compensation), no orphan left
      expect(await storedKeys(id)).toHaveLength(1);
    });

    it('deletes the stored file when the database insert fails (no orphan)', async () => {
      // No variants, so the product row can be deleted in the middle of the upload
      const id = await createProduct(t.prisma, {
        slug: 'szkic',
        name: 'Szkic',
        categoryId,
        originId,
        status: 'DRAFT',
        variants: [],
      });
      const put = t.storage.put.bind(t.storage);
      vi.spyOn(t.storage, 'put').mockImplementation(async (...args) => {
        await put(...args);
        // The file is in the bucket; now the product disappears before the insert
        await t.prisma.product.delete({ where: { id } });
      });

      await upload(id, fixtureJpeg()).expect(404);

      expect(await storedKeys(id)).toEqual([]);
    });
  });

  describe('PATCH /admin/products/:id/images/order', () => {
    async function productWithThreeImages() {
      const id = await product({ status: 'ACTIVE', images: ['p/a.webp', 'p/b.webp', 'p/c.webp'] });
      const images = await t.prisma.productImage.findMany({
        where: { productId: id },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      return { id, imageIds: images.map((image) => image.id) };
    }

    it('saves the new order, also seen by the public catalog', async () => {
      const { id, imageIds } = await productWithThreeImages();
      const [a, b, c] = imageIds as [string, string, string];

      const response = await reorder(id, [c, a, b]).expect(200);

      expect(
        (response.body as AdminProductDetail).images.map((image) => [image.id, image.position]),
      ).toEqual([
        [c, 0],
        [a, 1],
        [b, 2],
      ]);
      const catalog = await request(t.server).get('/api/v1/products/etiopia-guji').expect(200);
      expect((catalog.body as AdminProductDetail).images.map((image) => image.url)).toEqual(
        ['p/c.webp', 'p/a.webp', 'p/b.webp'].map(testImageUrl),
      );
    });

    it('requires every image of the product exactly once', async () => {
      const { id, imageIds } = await productWithThreeImages();
      const [a, b] = imageIds as [string, string, string];

      const missing = await reorder(id, [a, b]).expect(400);
      const foreign = await reorder(id, [a, b, MISSING_ID]).expect(400);
      await reorder(id, [a, b, a]).expect(400);

      expect(missing.body).toMatchObject({
        errors: [{ path: 'imageIds', message: IMAGE_ORDER_MISMATCH_MESSAGE }],
      });
      expect(foreign.body).toMatchObject({ errors: [{ path: 'imageIds' }] });
    });

    it('returns 404 for a missing product', async () => {
      await reorder(MISSING_ID, [MISSING_ID]).expect(404);
    });
  });

  describe('PATCH /admin/images/:id', () => {
    it('changes the alt text', async () => {
      const id = await product({ images: ['p/a.webp'] });
      const image = await t.prisma.productImage.findFirstOrThrow({ where: { productId: id } });

      const response = await updateAlt(image.id, 'Nowy opis').expect(200);

      expect((response.body as AdminProductDetail).images[0]).toMatchObject({ alt: 'Nowy opis' });
    });

    it('rejects a blank alt and returns 404 for a missing image', async () => {
      const id = await product({ images: ['p/a.webp'] });
      const image = await t.prisma.productImage.findFirstOrThrow({ where: { productId: id } });

      await updateAlt(image.id, '  ').expect(400);
      await updateAlt(MISSING_ID, 'Opis').expect(404);
    });
  });

  describe('DELETE /admin/images/:id', () => {
    it('deletes the row and the file, keeping the other positions gapless', async () => {
      const id = await product();
      await uploadOk(id, 'pierwsze');
      const body = await uploadOk(id, 'drugie');
      const [first] = body.images;
      const keysBefore = await storedKeys(id);

      await remove(first?.id ?? '').expect(204);

      const rows = await t.prisma.productImage.findMany({ where: { productId: id } });
      expect(rows.map((row) => [row.alt, row.position])).toEqual([['drugie', 0]]);
      const keysAfter = await storedKeys(id);
      expect(keysAfter).toHaveLength(1);
      expect(keysBefore).toContain(keysAfter[0]);
      expect(keysAfter[0]).toBe(rows[0]?.storageKey);
    });

    it('keeps the last image of a published product (row and file)', async () => {
      const id = await product();
      const body = await uploadOk(id);
      await t.prisma.product.update({ where: { id }, data: { status: 'ACTIVE' } });

      const response = await remove(body.images[0]?.id ?? '').expect(400);

      expect(response.body).toMatchObject({
        message: LAST_IMAGE_MESSAGE,
        errors: [{ path: 'images' }],
      });
      expect(await t.prisma.productImage.count()).toBe(1);
      expect(await storedKeys(id)).toHaveLength(1);
    });

    it('still deletes the row when the storage fails, leaving an orphaned file', async () => {
      const id = await product();
      const body = await uploadOk(id);
      vi.spyOn(t.storage, 'delete').mockRejectedValue(new Error('storage down'));

      await remove(body.images[0]?.id ?? '').expect(204);

      expect(await t.prisma.productImage.count()).toBe(0);
      // Found later by `pnpm storage:orphans`
      expect(await storedKeys(id)).toHaveLength(1);
    });

    it('returns 404 for a missing image', async () => {
      await remove(MISSING_ID).expect(404);
    });
  });
});

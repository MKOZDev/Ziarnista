import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { fixtureJpeg, solidImage } from '../../../../test/images';
import {
  IMAGE_TOO_MANY_PIXELS_MESSAGE,
  processProductImage,
  UNSUPPORTED_IMAGE_MESSAGE,
} from './image-processor';

describe('processProductImage', () => {
  it('converts a JPEG to WebP with the longer side at 1600 px', async () => {
    const result = await processProductImage(fixtureJpeg());

    expect(result).toMatchObject({ width: 1600, height: 1067 });
    expect((await sharp(result.data).metadata()).format).toBe('webp');
  });

  it.each(['png', 'webp'] as const)('accepts %s', async (format) => {
    const result = await processProductImage(await solidImage(400, 300, format));

    expect(result).toMatchObject({ width: 400, height: 300 });
  });

  it('does not enlarge a small image', async () => {
    const result = await processProductImage(await solidImage(200, 800, 'jpeg'));

    expect(result).toMatchObject({ width: 200, height: 800 });
  });

  it('applies the EXIF orientation and strips the metadata', async () => {
    // Stored as 300×100 with "rotate 90°" in EXIF: displayed (and saved) as 100×300
    const rotated = await sharp(await solidImage(300, 100, 'jpeg'))
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const result = await processProductImage(rotated);
    const metadata = await sharp(result.data).metadata();

    expect(result).toMatchObject({ width: 100, height: 300 });
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.exif).toBeUndefined();
  });

  it('rejects a GIF: a real image, but not an accepted format', async () => {
    await expect(processProductImage(await solidImage(10, 10, 'gif'))).rejects.toThrow(
      UNSUPPORTED_IMAGE_MESSAGE,
    );
  });

  it('rejects text and a truncated image', async () => {
    const jpeg = fixtureJpeg();

    await expect(processProductImage(Buffer.from('to nie jest zdjęcie'))).rejects.toThrow(
      UNSUPPORTED_IMAGE_MESSAGE,
    );
    await expect(processProductImage(jpeg.subarray(0, 200))).rejects.toThrow(
      UNSUPPORTED_IMAGE_MESSAGE,
    );
  });

  it('rejects an image over 40 Mpx before decoding it', async () => {
    // Tiny file, huge canvas: the decompression bomb case
    const bomb = await sharp({
      create: { width: 8000, height: 6000, channels: 3, background: '#000' },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();

    expect(bomb.length).toBeLessThan(1024 * 1024);
    await expect(processProductImage(bomb)).rejects.toThrow(IMAGE_TOO_MANY_PIXELS_MESSAGE);
  });
});

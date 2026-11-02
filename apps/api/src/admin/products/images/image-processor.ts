import { IMAGE_MAX_DIMENSION } from '@ziarnista/shared';
import sharp from 'sharp';

/** Formats sharp detects from the file content; the file name and reported type are ignored */
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

/**
 * A 5 MB PNG of a single colour can decode to gigapixels and exhaust the memory
 * (decompression bomb). 40 MP covers any photo from a phone or camera.
 */
const MAX_INPUT_PIXELS = 40_000_000;

const WEBP_QUALITY = 82;

export const UNSUPPORTED_IMAGE_MESSAGE = 'Plik nie jest obrazem JPEG, PNG ani WebP';
export const IMAGE_TOO_MANY_PIXELS_MESSAGE = 'Obraz ma za dużą rozdzielczość (maks. 40 Mpx)';

/** The upload is not an image the shop accepts; the message is meant for the admin */
export class UnsupportedImageError extends Error {
  constructor(message = UNSUPPORTED_IMAGE_MESSAGE) {
    super(message);
  }
}

export type ProcessedImage = { data: Buffer; width: number; height: number };

/**
 * Upload → stored WebP. The type is read from the content (magic bytes, via the decoder),
 * so a text file named photo.jpg is rejected and a PNG named photo.jpg is accepted.
 * Applies the EXIF orientation, fits the longer side into IMAGE_MAX_DIMENSION (never
 * enlarges) and drops all metadata, GPS position from a phone included.
 */
export async function processProductImage(input: Buffer): Promise<ProcessedImage> {
  const options = { limitInputPixels: MAX_INPUT_PIXELS };
  let metadata: sharp.Metadata;
  try {
    // Reads the header only, nothing is decoded, so no pixel limit is needed here; with the
    // limit sharp itself would fail, and the admin would get the generic message
    metadata = await sharp(input, { limitInputPixels: false }).metadata();
  } catch {
    // Not an image sharp can read at all (text, truncated file, ...)
    throw new UnsupportedImageError();
  }
  if (metadata.format === undefined || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new UnsupportedImageError();
  }
  if (metadata.width * metadata.height > MAX_INPUT_PIXELS) {
    throw new UnsupportedImageError(IMAGE_TOO_MANY_PIXELS_MESSAGE);
  }
  try {
    const { data, info } = await sharp(input, options)
      .rotate()
      .resize({
        width: IMAGE_MAX_DIMENSION,
        height: IMAGE_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    // The header was valid, the image data is not (or it is over the pixel limit)
    throw new UnsupportedImageError();
  }
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

// Test images. The committed fixture is also used by docs/api.http; the rest are generated
// in memory, so no heavy or odd files live in the repo.

/** 2400×1600 JPEG photo (committed, ~60 KB) */
export const FIXTURE_JPEG_PATH = join(__dirname, 'fixtures/images/kawa.jpg');

export function fixtureJpeg(): Buffer {
  return readFileSync(FIXTURE_JPEG_PATH);
}

type Format = 'jpeg' | 'png' | 'webp' | 'gif';

/** Solid-colour image of the given size and format */
export function solidImage(width: number, height: number, format: Format): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#c8553d' } })
    .toFormat(format)
    .toBuffer();
}

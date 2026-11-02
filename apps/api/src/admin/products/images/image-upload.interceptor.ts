import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMAGE_MAX_FILE_SIZE } from '@ziarnista/shared';
import type { Observable } from 'rxjs';
import { validationError } from '../../../common/validation-error';

export const IMAGE_FIELD = 'file';
export const FILE_TOO_LARGE_MESSAGE = `Plik jest za duży (maks. ${IMAGE_MAX_FILE_SIZE / 1024 / 1024} MB)`;

// No dest/storage: multer keeps the file in memory (file.buffer). At most 5 MB, and sharp
// reads a Buffer anyway, so no temporary files to clean up.
const MulterInterceptor = FileInterceptor(IMAGE_FIELD, {
  // multer stops reading a file at the limit and fails the request
  limits: { fileSize: IMAGE_MAX_FILE_SIZE, files: 1, fields: 5 },
});

/**
 * FileInterceptor with Polish errors. Nest turns multer errors into English messages
 * ("File too large"); this wraps only the multipart parsing, so errors thrown later by the
 * handler pass through untouched.
 */
@Injectable()
export class ImageUploadInterceptor implements NestInterceptor {
  private readonly multer = new MulterInterceptor();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    try {
      // Resolves after the body is parsed, with the handler's (not yet subscribed) stream
      return await this.multer.intercept(context, next);
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw new PayloadTooLargeException(FILE_TOO_LARGE_MESSAGE);
      }
      if (error instanceof BadRequestException) {
        // A second file, a file under another field name, a malformed body, ...
        throw validationError(
          [{ path: IMAGE_FIELD, message: `Wyślij jeden plik zdjęcia w polu "${IMAGE_FIELD}"` }],
          'Nieprawidłowe dane formularza',
        );
      }
      throw error;
    }
  }
}

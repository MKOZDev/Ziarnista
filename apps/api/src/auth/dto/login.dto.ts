import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_MAX_LENGTH, type LoginInput } from '@ziarnista/shared';

// Swagger description only; validation is done by loginSchema (ZodValidationPipe)
export class LoginDto implements LoginInput {
  @ApiProperty({ format: 'email', example: 'klient@example.com' })
  email: string;

  @ApiProperty({ maxLength: PASSWORD_MAX_LENGTH, example: 'change-me-klient-123' })
  password: string;
}

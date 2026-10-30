import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, type RegisterInput } from '@ziarnista/shared';

// Swagger description only; validation is done by registerSchema (ZodValidationPipe)
export class RegisterDto implements RegisterInput {
  @ApiProperty({
    format: 'email',
    example: 'jan@example.com',
    description: 'Zapisywany małymi literami',
  })
  email: string;

  @ApiProperty({
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    example: 'dlugie-haslo-123',
  })
  password: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Jan Kowalski' })
  name: string;
}

import { ApiProperty } from '@nestjs/swagger';
import type { AuthUser, Role } from '@ziarnista/shared';

// implements: the compiler flags any drift from the schema the frontends validate against
export class AuthUserDto implements AuthUser {
  @ApiProperty({ format: 'uuid', example: '019a3b2c-0000-7000-8000-000000000001' })
  id: string;

  @ApiProperty({ format: 'email', example: 'jan@example.com' })
  email: string;

  @ApiProperty({ example: 'Jan Kowalski' })
  name: string;

  @ApiProperty({ enum: ['CUSTOMER', 'ADMIN'], example: 'CUSTOMER' })
  role: Role;

  @ApiProperty({ format: 'date-time', example: '2026-10-30T12:00:00.000Z' })
  createdAt: string;
}

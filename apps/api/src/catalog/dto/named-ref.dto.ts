import { ApiProperty } from '@nestjs/swagger';
import type { NamedRef } from '@ziarnista/shared';

export class NamedRefDto implements NamedRef {
  @ApiProperty({ example: 'etiopia' })
  slug: string;

  @ApiProperty({ example: 'Etiopia' })
  name: string;
}

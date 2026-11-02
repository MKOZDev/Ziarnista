import { ApiProperty } from '@nestjs/swagger';
import type { AdminOrigin } from '@ziarnista/shared';

export class AdminOriginDto implements AdminOrigin {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Etiopia' })
  name: string;

  @ApiProperty({ example: 'etiopia' })
  slug: string;

  @ApiProperty({ description: 'Produkty z tym pochodzeniem, w każdym statusie', example: 3 })
  productCount: number;
}

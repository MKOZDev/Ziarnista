import { ApiProperty } from '@nestjs/swagger';
import type { CategoryNode } from '@ziarnista/shared';

export class CategoryNodeDto implements CategoryNode {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'kawa' })
  slug: string;

  @ApiProperty({ example: 'Kawa' })
  name: string;

  @ApiProperty({ description: 'Aktywne produkty w kategorii i jej podkategoriach', example: 15 })
  productCount: number;

  // Lazy type: the class refers to itself
  @ApiProperty({ type: () => [CategoryNodeDto] })
  children: CategoryNodeDto[];
}

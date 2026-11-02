import { ApiProperty } from '@nestjs/swagger';
import type { AdminCategory } from '@ziarnista/shared';

export class AdminCategoryDto implements AdminCategory {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Espresso' })
  name: string;

  @ApiProperty({ example: 'espresso' })
  slug: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'null = kategoria główna',
  })
  parentId: string | null;

  @ApiProperty({
    description: 'Produkty bezpośrednio w tej kategorii, w każdym statusie',
    example: 4,
  })
  productCount: number;

  @ApiProperty({ description: 'Liczba bezpośrednich podkategorii', example: 0 })
  childCount: number;
}

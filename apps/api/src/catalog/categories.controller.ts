import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CategoryNode } from '@ziarnista/shared';
import { CategoriesService } from './categories.service';
import { CategoryNodeDto } from './dto/category-node.dto';

@ApiTags('catalog')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Drzewo kategorii z liczbą aktywnych produktów (łącznie z podkategoriami)',
  })
  @ApiOkResponse({ type: [CategoryNodeDto] })
  tree(): Promise<CategoryNode[]> {
    return this.categories.getTree();
  }
}

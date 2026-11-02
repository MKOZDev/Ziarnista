import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createCategorySchema, updateCategorySchema, type AdminCategory } from '@ziarnista/shared';
import { AdminAuth } from '../../auth/decorators/auth.decorator';
import { ParseIdPipe } from '../../common/parse-id.pipe';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  AdminCategoriesService,
  CATEGORY_CYCLE_MESSAGE,
  CATEGORY_NOT_FOUND_MESSAGE,
  CATEGORY_SLUG_TAKEN_MESSAGE,
  PARENT_NOT_FOUND_MESSAGE,
} from './admin-categories.service';
import { AdminCategoryDto } from './dto/admin-category.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category-input.dto';

@ApiTags('admin-categories')
@AdminAuth()
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Wszystkie kategorie jako płaska lista (drzewo buduje panel z parentId)',
  })
  @ApiOkResponse({ type: [AdminCategoryDto] })
  list(): Promise<AdminCategory[]> {
    return this.categories.list();
  }

  @Post()
  @ApiOperation({ summary: 'Nowa kategoria' })
  @ApiCreatedResponse({ type: AdminCategoryDto })
  @ApiBadRequestResponse({ description: `Nieprawidłowe dane; ${PARENT_NOT_FOUND_MESSAGE}` })
  @ApiConflictResponse({ description: CATEGORY_SLUG_TAKEN_MESSAGE })
  create(
    @Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryDto,
  ): Promise<AdminCategory> {
    return this.categories.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Zmiana nazwy, slugu lub miejsca w drzewie' })
  @ApiOkResponse({ type: AdminCategoryDto })
  @ApiBadRequestResponse({
    description: `Nieprawidłowe dane; ${PARENT_NOT_FOUND_MESSAGE}; ${CATEGORY_CYCLE_MESSAGE}`,
  })
  @ApiNotFoundResponse({ description: CATEGORY_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({ description: CATEGORY_SLUG_TAKEN_MESSAGE })
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) body: UpdateCategoryDto,
  ): Promise<AdminCategory> {
    return this.categories.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Usunięcie pustej kategorii (bez produktów i podkategorii)' })
  @ApiNoContentResponse({ description: 'Kategoria usunięta' })
  @ApiNotFoundResponse({ description: CATEGORY_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({ description: 'Kategoria ma produkty lub podkategorie' })
  remove(@Param('id', ParseIdPipe) id: string): Promise<void> {
    return this.categories.remove(id);
  }
}

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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createOriginSchema, updateOriginSchema, type AdminOrigin } from '@ziarnista/shared';
import { AdminAuth } from '../../auth/decorators/auth.decorator';
import { ParseIdPipe } from '../../common/parse-id.pipe';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  AdminOriginsService,
  ORIGIN_NAME_TAKEN_MESSAGE,
  ORIGIN_NOT_FOUND_MESSAGE,
  ORIGIN_SLUG_TAKEN_MESSAGE,
} from './admin-origins.service';
import { AdminOriginDto } from './dto/admin-origin.dto';
import { CreateOriginDto, UpdateOriginDto } from './dto/origin-input.dto';

const NAME_OR_SLUG_TAKEN = `${ORIGIN_NAME_TAKEN_MESSAGE} / ${ORIGIN_SLUG_TAKEN_MESSAGE}`;

@ApiTags('admin-origins')
@AdminAuth()
@Controller('admin/origins')
export class AdminOriginsController {
  constructor(private readonly origins: AdminOriginsService) {}

  @Get()
  @ApiOperation({ summary: 'Słownik pochodzenia kawy z liczbą produktów' })
  @ApiOkResponse({ type: [AdminOriginDto] })
  list(): Promise<AdminOrigin[]> {
    return this.origins.list();
  }

  @Post()
  @ApiOperation({ summary: 'Nowe pochodzenie' })
  @ApiCreatedResponse({ type: AdminOriginDto })
  @ApiConflictResponse({ description: NAME_OR_SLUG_TAKEN })
  create(
    @Body(new ZodValidationPipe(createOriginSchema)) body: CreateOriginDto,
  ): Promise<AdminOrigin> {
    return this.origins.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Zmiana nazwy lub slugu' })
  @ApiOkResponse({ type: AdminOriginDto })
  @ApiNotFoundResponse({ description: ORIGIN_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({ description: NAME_OR_SLUG_TAKEN })
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(updateOriginSchema)) body: UpdateOriginDto,
  ): Promise<AdminOrigin> {
    return this.origins.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Usunięcie nieużywanego pochodzenia' })
  @ApiNoContentResponse({ description: 'Pochodzenie usunięte' })
  @ApiNotFoundResponse({ description: ORIGIN_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({ description: 'Pochodzenie jest używane przez produkty' })
  remove(@Param('id', ParseIdPipe) id: string): Promise<void> {
    return this.origins.remove(id);
  }
}

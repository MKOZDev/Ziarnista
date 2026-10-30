import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@ziarnista/shared';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUserDto } from './dto/auth-user.dto';
import { toAuthUser, type PublicUser } from './public-user';

@ApiTags('auth')
@Controller('me')
export class MeController {
  @Get()
  @Auth()
  @ApiOperation({ summary: 'Zalogowany klient' })
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser() user: PublicUser): AuthUser {
    return toAuthUser(user);
  }
}

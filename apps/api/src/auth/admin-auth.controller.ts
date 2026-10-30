import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { loginSchema, type AuthUser } from '@ziarnista/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Role, SessionScope } from '../generated/prisma/enums';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth.service';
import { AdminAuth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { toAuthUser, type PublicUser } from './public-user';
import { SessionCookies } from './session-cookies';
import { SessionsService } from './sessions.service';

const SCOPE = SessionScope.ADMIN;

@ApiTags('admin-auth')
@Controller('admin')
export class AdminAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
    private readonly cookies: SessionCookies,
  ) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Logowanie do panelu (cookie zia_admin_session, 8 h, tylko ADMIN)' })
  @ApiOkResponse({ type: AuthUserDto })
  @ApiBadRequestResponse({ description: 'Nieprawidłowe dane' })
  @ApiUnauthorizedResponse({ description: INVALID_CREDENTIALS_MESSAGE })
  @ApiForbiddenResponse({ description: 'Nagłówek Origin spoza ALLOWED_ORIGINS (ochrona CSRF)' })
  @ApiTooManyRequestsResponse({ description: 'Przekroczony limit prób' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const user = await this.auth.verifyCredentials(body);
    // A customer account gets the same answer as a wrong password: the panel login
    // must not confirm that an email has an account in the shop
    if (!user || user.role !== Role.ADMIN) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
    const session = await this.sessions.create(user.id, SCOPE, this.cookies.read(req, SCOPE));
    this.cookies.set(res, SCOPE, session.token, session.expiresAt);
    return toAuthUser(user);
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Wylogowanie z panelu; idempotentne' })
  @ApiNoContentResponse({ description: 'Sesja usunięta, cookie wyczyszczone' })
  @ApiForbiddenResponse({ description: 'Nagłówek Origin spoza ALLOWED_ORIGINS (ochrona CSRF)' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = this.cookies.read(req, SCOPE);
    if (token) {
      await this.sessions.revoke(token, SCOPE);
    }
    this.cookies.clear(res, SCOPE);
  }

  @Get('me')
  @AdminAuth()
  @ApiOperation({ summary: 'Zalogowany administrator' })
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser() user: PublicUser): AuthUser {
    return toAuthUser(user);
  }
}

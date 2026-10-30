import {
  Body,
  Controller,
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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { loginSchema, registerSchema, type AuthUser } from '@ziarnista/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SessionScope } from '../generated/prisma/enums';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { toAuthUser } from './public-user';
import { SessionCookies } from './session-cookies';
import { SessionsService } from './sessions.service';

const SCOPE = SessionScope.STOREFRONT;

@ApiTags('auth')
@ApiForbiddenResponse({ description: 'Nagłówek Origin spoza ALLOWED_ORIGINS (ochrona CSRF)' })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
    private readonly cookies: SessionCookies,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Rejestracja klienta; od razu loguje (cookie zia_session)' })
  @ApiCreatedResponse({ type: AuthUserDto })
  @ApiBadRequestResponse({ description: 'Nieprawidłowe dane' })
  @ApiConflictResponse({ description: 'Konto z tym adresem email już istnieje' })
  @ApiTooManyRequestsResponse({ description: 'Przekroczony limit prób' })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const user = await this.auth.register(body);
    const session = await this.sessions.create(user.id, SCOPE, this.cookies.read(req, SCOPE));
    this.cookies.set(res, SCOPE, session.token, session.expiresAt);
    return toAuthUser(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Logowanie klienta (ustawia cookie zia_session, 30 dni)' })
  @ApiOkResponse({ type: AuthUserDto })
  @ApiBadRequestResponse({ description: 'Nieprawidłowe dane' })
  @ApiUnauthorizedResponse({ description: INVALID_CREDENTIALS_MESSAGE })
  @ApiTooManyRequestsResponse({ description: 'Przekroczony limit prób' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const user = await this.auth.verifyCredentials(body);
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
    const session = await this.sessions.create(user.id, SCOPE, this.cookies.read(req, SCOPE));
    this.cookies.set(res, SCOPE, session.token, session.expiresAt);
    return toAuthUser(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Wylogowanie klienta; idempotentne, działa też bez sesji' })
  @ApiNoContentResponse({ description: 'Sesja usunięta, cookie wyczyszczone' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = this.cookies.read(req, SCOPE);
    if (token) {
      await this.sessions.revoke(token, SCOPE);
    }
    this.cookies.clear(res, SCOPE);
  }
}

import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminAuthController } from './admin-auth.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { SessionGuard } from './guards/session.guard';
import { LOGIN_THROTTLERS, THROTTLE_ERROR_MESSAGE } from './login-throttlers';
import { MeController } from './me.controller';
import { SessionCookies } from './session-cookies';
import { SessionsService } from './sessions.service';

// Modules with @Auth()/@AdminAuth() routes import AuthModule, so the guards' dependencies resolve
@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: LOGIN_THROTTLERS, errorMessage: THROTTLE_ERROR_MESSAGE }),
  ],
  controllers: [AuthController, MeController, AdminAuthController],
  providers: [AuthService, SessionsService, SessionCookies, SessionGuard, RolesGuard],
  exports: [SessionsService, SessionCookies, SessionGuard, RolesGuard],
})
export class AuthModule {}

import { Injectable } from '@nestjs/common';
import type { SessionScope } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect, type PublicUser } from './public-user';
import { SESSION_POLICIES } from './session-policy';
import { generateSessionToken, hashSessionToken, shouldRenewSession } from './session-token';

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

export interface ValidSession {
  user: PublicUser;
  expiresAt: Date;
  /** True when the expiry was moved forward and the cookie must be sent again. */
  renewed: boolean;
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Always issues a fresh token (protects against session fixation). The session the
   * request came with, if any, is deleted so a login never leaves an orphan behind.
   */
  async create(
    userId: string,
    scope: SessionScope,
    previousToken: string | null,
  ): Promise<IssuedSession> {
    if (previousToken) {
      await this.revoke(previousToken, scope);
    }
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_POLICIES[scope].ttlMs);
    await this.prisma.session.create({
      data: { id: hashSessionToken(token), userId, scope, expiresAt },
    });
    return { token, expiresAt };
  }

  /** Returns null for unknown, expired or other-scope tokens. Expired sessions are deleted. */
  async validate(
    token: string,
    scope: SessionScope,
    now = new Date(),
  ): Promise<ValidSession | null> {
    const id = hashSessionToken(token);
    const session = await this.prisma.session.findUnique({
      where: { id },
      select: { scope: true, expiresAt: true, user: { select: publicUserSelect } },
    });
    // A token from the other app's cookie is rejected, otherwise an admin token placed in the
    // storefront cookie would be extended by the sliding policy past its fixed 8 hours.
    if (!session || session.scope !== scope) {
      return null;
    }
    if (session.expiresAt <= now) {
      await this.prisma.session.deleteMany({ where: { id } });
      return null;
    }

    const policy = SESSION_POLICIES[scope];
    if (!shouldRenewSession(session.expiresAt, now, policy)) {
      return { user: session.user, expiresAt: session.expiresAt, renewed: false };
    }
    const expiresAt = new Date(now.getTime() + policy.ttlMs);
    await this.prisma.session.update({ where: { id }, data: { expiresAt } });
    return { user: session.user, expiresAt, renewed: true };
  }

  /** deleteMany, not delete: logging out with an unknown token is not an error. */
  async revoke(token: string, scope: SessionScope): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: hashSessionToken(token), scope } });
  }
}

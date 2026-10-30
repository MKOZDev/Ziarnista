import { randomBytes } from 'node:crypto';
import { ConflictException, Injectable, type OnModuleInit } from '@nestjs/common';
import type { LoginInput, RegisterInput } from '@ziarnista/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password';
import { publicUserSelect, type PublicUser } from './public-user';

// One message for an unknown email and a wrong password, so the response reveals neither
export const INVALID_CREDENTIALS_MESSAGE = 'Nieprawidłowy email lub hasło';

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyPasswordHash: string;

  constructor(private readonly prisma: PrismaService) {}

  // Hashed with the current options, so verifying against it costs as much as a real check
  async onModuleInit(): Promise<void> {
    this.dummyPasswordHash = await hashPassword(randomBytes(32).toString('hex'));
  }

  async register(input: RegisterInput): Promise<PublicUser> {
    const passwordHash = await hashPassword(input.password);
    try {
      return await this.prisma.user.create({
        data: { email: input.email, name: input.name, passwordHash },
        select: publicUserSelect,
      });
    } catch (error) {
      // The unique index decides, not a prior SELECT: two parallel requests cannot both pass
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Konto z tym adresem email już istnieje');
      }
      throw error;
    }
  }

  /**
   * Returns the user when the password matches, otherwise null. An unknown email is checked
   * against a dummy hash, so both failures take about the same time and cannot be told apart.
   */
  async verifyCredentials(input: LoginInput): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { ...publicUserSelect, passwordHash: true },
    });
    if (!user) {
      await verifyPassword(this.dummyPasswordHash, input.password);
      return null;
    }
    const { passwordHash, ...publicUser } = user;
    return (await verifyPassword(passwordHash, input.password)) ? publicUser : null;
  }
}

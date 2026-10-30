import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { HealthResponseDto } from './health-response.dto';

const DB_CHECK_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponseDto> {
    const databaseUp = await this.isDatabaseUp();
    return {
      status: databaseUp ? 'ok' : 'error',
      database: databaseUp ? 'up' : 'down',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  private async isDatabaseUp(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Database check timed out')), DB_CHECK_TIMEOUT_MS);
    });

    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

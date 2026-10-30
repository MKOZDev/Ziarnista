import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureApp } from '../app-setup';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { HealthModule } from './health.module';

describe('GET /api/v1/health', () => {
  let app: INestApplication;
  let server: Server;
  // Only the method HealthService uses; no real database needed
  const prismaMock = { $queryRaw: vi.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, HealthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
    vi.resetAllMocks();
  });

  it('returns 200 when the database responds', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const response = await request(server).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('returns 503 when the database query fails', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const response = await request(server).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({ status: 'error', database: 'down' });
  });
});

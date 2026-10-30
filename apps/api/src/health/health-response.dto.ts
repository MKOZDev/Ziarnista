import { ApiProperty } from '@nestjs/swagger';
import type { HealthResponse } from '@ziarnista/shared';

// implements: the compiler flags any drift from the schema the frontends validate against
export class HealthResponseDto implements HealthResponse {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status: 'ok' | 'error';

  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  database: 'up' | 'down';

  @ApiProperty({ description: 'Process uptime in seconds', example: 42.1 })
  uptime: number;

  @ApiProperty({ format: 'date-time', example: '2026-10-30T12:00:00.000Z' })
  timestamp: string;
}

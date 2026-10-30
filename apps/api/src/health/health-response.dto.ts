import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status: 'ok' | 'error';

  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  database: 'up' | 'down';

  @ApiProperty({ description: 'Process uptime in seconds', example: 42.1 })
  uptime: number;

  @ApiProperty({ format: 'date-time', example: '2026-10-30T12:00:00.000Z' })
  timestamp: string;
}

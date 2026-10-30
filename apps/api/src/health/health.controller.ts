import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthResponseDto } from './health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'API and database status' })
  @ApiOkResponse({ type: HealthResponseDto, description: 'API and database are up' })
  @ApiServiceUnavailableResponse({ type: HealthResponseDto, description: 'Database is down' })
  async check(): Promise<HealthResponseDto> {
    const health = await this.healthService.check();
    if (health.status !== 'ok') {
      // 503 so Docker healthchecks and load balancers see the failure without parsing the body
      throw new ServiceUnavailableException(health);
    }
    return health;
  }
}

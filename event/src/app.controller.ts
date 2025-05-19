import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return { status: 'OK' }; // 체크용 API
  }
}

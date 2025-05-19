import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 유효성 검사 (DTO 검증 작동을 위해 꼭 필요)
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 조건횟수를 string-number로 변환하기에 추가
  }));

  //tokencheck필요 user_id
  app.use(cookieParser());
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

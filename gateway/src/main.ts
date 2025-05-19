import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import authRouter from './routes/auth.route'; // auth route 
import eventRouter from './routes/event.route'; // event route
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Express 인스턴스 
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(express.urlencoded({ extended: true })); //폼 데이터 파싱 (form-urlencoded)
  expressApp.use(express.json()); //JSON 본문 파싱
  
  //  정적 파일 dist/public (img, css)
  app.useStaticAssets(join(__dirname, 'public'));

  // EJS 뷰는 dist/view 기준
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('ejs');
  
  //jwt token을 위한 cookieparser
  app.use(cookieParser());

  // Express 라우터 연결
  expressApp.use('/auth', authRouter); 
  expressApp.use('/event', eventRouter);


  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }),// .env 전역 사용 가능하게 설정      
    MongooseModule.forRoot(process.env.MONGO_URI),
    UserModule, //User관련 추가
    JwtModule.registerAsync({
      global: true,//전역으로 사용하기위해서추가
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        return {
          secret: secret || 'ajssuperkey',
          signOptions: { noTimestamp: true },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule {}

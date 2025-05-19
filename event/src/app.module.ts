import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { EventController } from './events/event.controller';
import { EventService } from './events/event.service';
import { Event, EventSchema } from './events/event.schema';
import { RewardRequest, RewardRequestSchema } from './events/reward/reward-request.schema';
import { EventUserParticipation, EventUserParticipationSchema } from './events/event-user-participations.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }), // .env 사용 가능하게 설정
    MongooseModule.forRoot(process.env.MONGO_URI),

    //event와 reward 모델 모두 등록
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: RewardRequest.name, schema: RewardRequestSchema },
      { name: EventUserParticipation.name, schema: EventUserParticipationSchema }, 
    ]),

  ],
  controllers: [AppController, EventController], // 라우터 등록 
  providers: [EventService],
})
export class AppModule { };

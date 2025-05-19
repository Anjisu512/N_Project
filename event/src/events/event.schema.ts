import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema()
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  condition: string;

  // dropdown에 없는 조건일 경우 custom_condition에 저장
  @Prop()
  custom_condition?: string;

  @Prop({ required: true })
  value: number;

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true })
  endDate: string;

  //보상을 다중으로 할 수 있도록 prop 수정함
  @Prop([
    {
      type: {
        type: String,   // 보상 타입 예: '캐시', '포인트', '장비교환권'
        required: true,
      },
      amount: {
        type: Number,   // 보상 수량 예: 100, 500, 1
        required: true,
        min: 1,
      },
    },
  ])
  rewards: { type: string; amount: number }[];

  @Prop()
  updatedBy?: string;

  @Prop()
  updatedAt?: Date;

  @Prop({ enum: ['active', 'inactive'], default: 'inactive' })
  status: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);

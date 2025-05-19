import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventUserParticipationDocument = EventUserParticipation & Document;

@Schema({ timestamps: true, strict: false }) // strict 중요 : 동적 필드 허용 => 이벤트 조건의 custom_condition으로인해 추가됨
export class EventUserParticipation {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // 아래 필드는 삭제 또는 필요시 보조 용도로만 사용 가능
  // @Prop({ type: Number, default: 0 })
  // currentCount: number;

  //조건충족여부
  @Prop({ type: Boolean, default: false })
  isEligible: boolean;

  @Prop({ type: Date })
  completedAt?: Date;

  //조건은 동적으로 들어옴 @Prop설정안해줘도됨
  
}

export const EventUserParticipationSchema = SchemaFactory.createForClass(EventUserParticipation);
EventUserParticipationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

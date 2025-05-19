import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;
export enum UserRole {
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
  OPERATOR = 'OPERATOR',
  USER = 'USER',
}
//event의 schema/model과 통일
@Schema()
class Reward {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  amount: number;
};
//유저의 보상 이력확인 schema
@Schema()
class RewardHistory {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  eventTitle: string;

  @Prop({ type: [Reward], required: true })
  rewards: Reward[];

  @Prop({required: true })
  approvedAt: Date;

  @Prop({required: true })
  requestedAt: Date;
};

export const RewardHistorySchema = SchemaFactory.createForClass(RewardHistory);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.USER] }) //가입시 기본은 USER
  roles: UserRole[];

  //유저정보와 연결된 유저의 보상 이력  
  @Prop({ type: [RewardHistorySchema], default: [] })
  rewardHistories: RewardHistory[];
};

export const UserSchema = SchemaFactory.createForClass(User);


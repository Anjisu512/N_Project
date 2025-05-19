import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RewardRequestDocument = RewardRequest & Document;

@Schema({ timestamps: true }) // timestamps: true => createdAt 와 updatedAt을 자동으로 생성해줌  createdAt는 요청 시점이 되고 updated는 보상 수령으로 관리
export class RewardRequest {
    // 유저가 어떤 event(id)의 보상을 받았는지 여부를 확인하는 reward schema
    @Prop({ required: true }) userId: string;
    @Prop({ required: true }) eventId: string;
    @Prop({ enum: ['requested', 'approved', 'rejected', 'given'], default: 'requested' }) status: string;

    @Prop() createdAt?: Date; // timestamps 설정해두었으나 service에서 사용시 prop을 찾지못해 추가함
    @Prop() updatedAt?: Date; // 동일
    @Prop() requestedAt?: Date;// 생성시 자동으로 추가되었으나 수정(거절후 재요청)시에 필요

    @Prop({ type: Boolean, default: false }) //기본값은 false, 거절된 경우에 알람을 위해 추가됨
    isCheck: boolean;

}

export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);

import { Schema, model } from 'mongoose';

const EventSchema = new Schema({
  title: { type: String, required: true }, // 이벤트 제목
  description: { type: String },           // 이벤트 설명 (선택)

  condition: { type: String, required: true },        // 조건 키워드
  custom_condition: { type: String },                 // 사용자 정의 조건 (선택)
  value: { type: Number, required: true },            // 조건 수치값

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

 //보상을 다중 등록할 수 있는 필드
 rewards: [
  {
    type: {
      type: String,  // 보상 종류 (예: 캐시, 포인트 등)
      required: false,
    },
    amount: {
      type: Number,  // 보상 수량
      required: false,
      min: 1,
    },
  }
],

  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // 만든 사람 (선택)

}, { timestamps: true }); // 생성일/수정일 자동 기록

export const Event = model('Event', EventSchema);

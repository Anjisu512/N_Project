import { IsString } from 'class-validator';

//유저의 event참여를 위해 body값으로 보내지는 eventId를 dto로 선언
export class ParticipateEventDto {
  @IsString()
  eventId: string;
}

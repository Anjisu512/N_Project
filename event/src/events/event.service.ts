import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Event, EventDocument } from './event.schema';
import { Model, Types } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { RewardRequest, RewardRequestDocument } from './reward/reward-request.schema';
import { EventUserParticipation, EventUserParticipationDocument } from './event-user-participations.schema';
import { ParticipateEventDto } from './dto/participate-event.dto';
import axios from 'axios';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>, //이벤트 모델
    @InjectModel(RewardRequest.name) private rewardRequestModel: Model<RewardRequestDocument>, // 보상 모델
    @InjectModel(EventUserParticipation.name) private eventUserParticipationModel: Model<EventUserParticipationDocument>, // 유저 참여정보 모델

  ) { };

  //이벤트 조회 
  async findAll(roles: string[]): Promise<Event[]> {
    const all = await this.eventModel.find().lean();

    // 관리자 또는 운영자권한이 둘다 없으면 
    if (!roles.includes('ADMIN') && !roles.includes('OPERATOR')) {
      const now = new Date();
      return all.filter(ev => {
        const start = new Date(ev.startDate);
        const end = new Date(ev.endDate);

        // 종료일을 하루의 끝으로 보정 (예: 2025-01-01까지 보이게)
        end.setHours(23, 59, 59, 999);

        return (start <= now && now <= end) && ev.status === 'active';
      });
    } else {
      return all;
    }
  };

  //이벤트 등록 
  async registerEvent(dto: CreateEventDto) {
    const createdEvent = new this.eventModel({
      ...dto,

      // condition 처리 로직: custom이면 custom_condition 값으로 대체
      condition:
        dto.condition === 'custom' && dto.custom_condition
          ? dto.custom_condition
          : dto.condition,
    });

    const saved = await createdEvent.save();
    console.log('MongoDB에 저장된 이벤트:', saved);

    return { message: '이벤트 등록 성공', eventId: saved._id };
  };

  //이벤트 삭제
  async deleteEvent(id: string): Promise<{ message: string }> {
    const result = await this.eventModel.findByIdAndDelete(id);

    if (!result) {
      throw new BadRequestException('삭제할 이벤트가 존재하지 않거나 이미 삭제됨');
    };

    return { message: '이벤트가 삭제되었습니다.' };
  };

  // 이벤트 보상 등록 / 수정
  async updateRewardInfo(eventId: string, rewards: { type: string; amount: number }[], status: string, userId: string,): Promise<{ message: string }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('해당 이벤트를 찾을 수 없습니다.');
    };

    // 다중 보상 정보 저장
    event.rewards = rewards;

    // 메타 정보
    event.updatedAt = new Date();
    event.updatedBy = userId;

    // 상태 업데이트
    if (status === 'active' || status === 'inactive') {
      event.status = status;
    } else if (!event.status) {
      event.status = 'inactive'; // 기본값
    };
    await event.save();
    return { message: '보상 정보가 성공적으로 저장되었습니다.' };
  };

  // 이벤트 보상 수령 상태 조회
  async getRewardStatus(userId: string, eventId: string) {
    const record = await this.rewardRequestModel.findOne({ userId, eventId }).lean();

    if (!record) {
      return { status: 'none' }; // 요청한 적 없음
    };

    return { status: record.status }; // 해당status는 api의 status가 아니라 보상상태임 => 예: 'requested', 'given'
  };

  //유저의 이벤트 참여 기능
  async userParticipate(userId: string, dto: ParticipateEventDto): Promise<{ message: string }> {
    const { eventId } = dto;

    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('해당 이벤트를 찾을 수 없습니다.');
    };

    const conditionKey = event.custom_condition || event.condition;

    await this.eventUserParticipationModel.findOneAndUpdate(
      // { userId, eventId } => userId와 eventId가 ObjectId("682587...")형식이 아닌 "682587..." (string)으로 저장되는 문제가 발견되어 아래처럼 수정함        
      {
        userId: new Types.ObjectId(userId),
        eventId: new Types.ObjectId(eventId),
      },
      {
        $inc: { [conditionKey]: 1 },
        $setOnInsert: { //string이 아닌 object로 저장됐는지 확인
          userId: new Types.ObjectId(userId),
          eventId: new Types.ObjectId(eventId),
        }
      },
      { upsert: true, new: true, }
    );
    return { message: `이벤트 참여 완료 (${conditionKey} +1)` };
  }

  //유저의 이벤트 참여도 확인
  async getUserConditionProgress(userId: string, eventId: string)
    : Promise<{ //반환값 변경(요청처리시 확인해야될 부분이 추가됨)
      conditionKey: string;
      userProgress: number;
      requiredValue: number;
      isComplete: boolean;
    }> {

    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }
    const conditionKey = event.custom_condition || event.condition;
    const requiredValue = event.value ?? 0;// condition에 대한 조건 값 (예: 3회)

    const participation = await this.eventUserParticipationModel.findOne({ //여기도 { userId, eventId } 이거 수정
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
    });

    const userProgress = participation?.[conditionKey] ?? 0;

    return {
      conditionKey,           // 예: 'attendance'
      userProgress,           // 예: 2
      requiredValue,          // 예: 3
      isComplete: userProgress >= requiredValue, //충족?
    };
  };

  // 보상 요청
  async requestReward(userId: string, eventId: string): Promise<{ message: string }> {
    // 1. 이벤트 존재 여부 확인
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('해당 이벤트를 찾을 수 없습니다.');
    };

    // 2. 유저의 참여 상태 조회
    const participation = await this.eventUserParticipationModel.findOne({
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
    });

    if (!participation) {
      throw new BadRequestException('이벤트에 아직 참여 기록이 없습니다.');
    };

    // 3. 조건 만족 여부 검사
    const conditionKey = event.custom_condition || event.condition; // 예: 'login_count'
    const requiredValue = event.value;      // 예: 3

    const userValue = typeof participation[conditionKey] === 'number' ? participation[conditionKey] : 0;

    if (typeof userValue !== 'number' || userValue < requiredValue) {
      throw new BadRequestException(
        `이벤트 조건을 만족하지 않아 보상을 요청할 수 없습니다. (${userValue || 0}/${requiredValue})`,
      );
    };
    // 4. 기존 보상 요청 여부 확인
    const existing = await this.rewardRequestModel.findOne({ userId, eventId });
    if (existing) {
      if (existing.status === 'given') {
        throw new BadRequestException('이미 보상을 수령하셨습니다.');
      } else if (existing.status === 'requested') {
        throw new BadRequestException('이미 보상을 요청하셨습니다.');
      } else if (existing.status === 'approved') {
        throw new BadRequestException('보상 요청이 승인되었습니다. [보상 지급 예정]');
      } else if (existing.status === 'rejected') {
        // 상태를 다시 요청으로 되돌림
        existing.status = 'requested';
        existing.requestedAt = new Date();
        await existing.save();
        return { message: '보상 요청이 다시 제출되었습니다.' };
      };;
    };

    // 5. 보상 요청 저장
    const newRequest = new this.rewardRequestModel({
      userId,
      eventId,
      status: 'requested',
      requestedAt: new Date(),
    });
    await newRequest.save();

    return { message: '보상 요청이 완료되었습니다.' };
  }

  //보상 요청 목록 get
  async getRewardRequestsByEvent(eventId: string, token: string) {
    const requests = await this.rewardRequestModel.find({
      eventId,
      status: 'requested',  // 처리되지 않은 요청만 
    }).lean();              // + 속성이 모두보이도록 
    const userInfoList = [];
    for (const req of requests) { //요청과 유저정보를 종합
      let username = '알 수 없음';

      try {
        const response = await axios.get(`http://auth:3000/users/${req.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.username) {
          username = response.data.username;
        }
      } catch (err) {
        console.warn(`유저 정보 요청 실패 (userId: ${req.userId})`, err?.response?.data || err.message);
      }

      //유저의 이벤트 참여도 확인
      const eventConditionInUser = await this.checkEventCondition(req.userId, eventId);
      const userInfo = {
        userId: req.userId,
        username: username,
        requestedAt: req.requestedAt,
        updatedAt: req.updatedAt,
        eventConditionInUser: eventConditionInUser,
        status: req.status,
      };

      userInfoList.push(userInfo);
    };

    return userInfoList;
  };

  //유저의 이벤트 참여(충족) 달성률이 100%가 맞는지 한번더 체크
  async checkEventCondition(userId: string, eventId: string): Promise<{
    conditionKey: string;
    userProgress: number;
    requiredValue: number;
    isComplete: boolean;
  }> {
    try {
      const progress = await this.getUserConditionProgress(userId, eventId);
      //progress.conditionKey, // 예: 'login_count'
      //progress.userProgress, // 예: 2
      //progress.requiredValue // 예: 3
      //isComplete: userProgress >= requiredValue, //충족?
      return progress;
    } catch (err) {
      console.warn(`이벤트 조건 확인 실패 (userId: ${userId}, eventId: ${eventId})`, err.message);
      return { conditionKey: 'unknown', userProgress: -1, requiredValue: -1, isComplete: false, };;
    };
  };

  //보상 승인
  async approveReward(userId: string, eventId: string, approverId: string, token: string) {
    const request = await this.rewardRequestModel.findOne({ userId, eventId });
    if (!request) {
      throw new NotFoundException('보상 요청을 찾을 수 없습니다.');
    }
    if (request.status !== 'requested') {
      throw new BadRequestException('이미 처리된 보상 요청입니다.');
    }
    request.status = 'approved';
    request.updatedAt = new Date();
    // request.approvedBy = approverId; 만약 추후 누가 승인했는지 여부가 필요하다면 추가/schema도 추가
    await request.save();

    /*먼저 바로 위에서 DB에 보상 요청 처리 완료로 save이후 Auth Server의 User 정보에 보상 및 수량을 추가(업데이트) 해준다*/
    const event = await this.eventModel.findById(eventId).lean();
    if (!event || !event.rewards) {
      throw new NotFoundException('이벤트 보상 정보가 없습니다.');
    }
    //event 보상의 승인시간(updatedAt)을 승인 시각으로 재활용
    const approvedAt = new Date(request.updatedAt).toISOString();
    const requestedAt = new Date(request.requestedAt).toISOString(); // 유저의 보상 요청일

    // DTO 구조에 맞춰 rewards에서 _id 제거 <추후 reward History의 보상관련하여 id를 사용한다면 제거하고 _id를 auth의 save-reward-history.dto에 prop추가
    const cleanedRewards = event.rewards.map((reward) => ({
      type: reward.type,
      amount: reward.amount,
    }));

    // 최종 post body 구성
    const postBody = {
      userId, // string
      eventId, // string
      eventTitle: event.title, // string
      rewards: cleanedRewards, // RewardDto[]
      approvedAt, // string(ISO)
      requestedAt, //유저의 보상요청일
    };

    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    }
    await axios.post('http://auth:3000/save-reward-history', postBody, {
      headers: {
        Cookie: `access_token=${token}`,
        'Content-Type': 'application/json',
      },
    });

    /**
     * 유저 history까지[보상지급] 정상적으로 작동됐다면 보상요청은 승인 => approved상태에서 given으로 변경 
     * 만약 given이 안됐더래도 프로세스상 유저보상지급이 먼저이기때문에 중복요청불가(이미 요청승인상태 approved)이고 QnA등 요청한다한들
     * saveHistory가 남아있기에 확인하면 중복지급 불가함*/
    request.status = 'given';
    request.updatedAt = new Date();
    await request.save();

    return { message: '보상 요청이 승인되었습니다.' };
  }


  //보상 요청 거절
  async rejectReward(userId: string, eventId: string): Promise<any> {
    const request = await this.rewardRequestModel.findOne({ userId, eventId });
    if (!request) {
      throw new NotFoundException('보상 요청을 찾을 수 없습니다.');
    }

    //['requested', 'approved', 'rejected', 'given'], default: 'requested' }
    //request외의 status라면 이미 처리된 요청입니다 표시
    if (['given', 'approved', 'rejected'].includes(request.status)) {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }
    request.status = 'rejected';
    request.requestedAt = null;
    await request.save();
    return { message: '보상 요청 거절이 완료되었습니다.' };
  }

  // 거절된 보상 요청 + 이벤트명 반환 [유저 알림용]
  async getRejectedRewards(userId: string): Promise<{ eventTitle: string; rejectedAt: Date }[]> {
    const rejectedRequests = await this.rewardRequestModel.find({
      userId,
      status: 'rejected', //userId에 맞는 rejected된 event호출
      isCheck: false // isCheck가 false라면 1번도 확인되지않은 보상 거절된 이벤트임
    }).lean();

    if (!rejectedRequests.length) {
      return []
    };

    const eventIds = rejectedRequests.map(r => r.eventId);
    const events = await this.eventModel.find({
      _id: { $in: eventIds },
    }).lean();

    return rejectedRequests.map(req => {
      const matchedEvent = events.find(e => e._id.toString() === req.eventId.toString());
      return {
        eventId: req.eventId,
        eventTitle: matchedEvent?.title || '알 수 없는 이벤트',
        rejectedAt: req.updatedAt, //거절됨 = update날짜
      };
    });
  }

  //거절된 이벤트를 유저가 확인한 경우 isCheck를 true로 변경
  async markRejectedRewardsChecked(userId: string, eventIds: string[]) {
    return await this.rewardRequestModel.updateMany(
      {
        userId,
        eventId: { $in: eventIds }, // 여기는 ObjectId('string')이 아닌 문자열 배열 그대로
        status: 'rejected'
      },
      {
        $set: { isCheck: true }
      }
    );
  };


}
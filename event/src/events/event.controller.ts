import { Body, Controller, Post, Get, Query, Req, Res, UnauthorizedException, BadRequestException, Delete, Param, Patch } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) { };

  //이벤트 등록
  @Post('register')
  async registerEvent(@Body() createEventDto: CreateEventDto) {
    return await this.eventService.registerEvent(createEventDto);
  };

  //모든 event가져오기
  @Get('getEvents')
  async getEvents(@Req() req: Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    };

    let roles: [];
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      roles = decoded.roles;
      if (!roles) {
        throw new UnauthorizedException('JWT에 role 정보가 없습니다.');
      };
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('JWT 유효하지 않음');
    };

    // 역할 정보만 넘기고 필터링은 서비스에서
    return await this.eventService.findAll(roles);
  };

  //운영자 혹은 이벤트관리자가 이벤트 보상을 등록/수정하는 기능
  @Post('updateReward')
  async updateReward(@Req() req: Request, @Body() body: any) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    };

    let userId: string;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.sub;
      if (!userId) {
        throw new UnauthorizedException('userId 누락');
      };
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('유효하지 않은 JWT');
    };

    //eventID, 보상(Type,Amount), 이벤트활성화상태
    const { eventId, rewards, status } = body;

    if (!eventId || !Array.isArray(rewards)) {
      throw new BadRequestException('필수 값 누락: eventId 또는 rewards');
    };

    // rewards 배열 내 각 항목 검증
    for (const reward of rewards) {
      //보상은 string
      if (!reward.type || typeof reward.type !== 'string') {
        throw new BadRequestException('보상 type이 잘못되었습니다.');
      }
      //reward는 number로 들어와야함(수량)
      if (typeof reward.amount !== 'number' || reward.amount < 1) {
        throw new BadRequestException('보상 amount가 유효하지 않습니다. 최소 1 이상이어야 합니다.');
      };
    };

    return await this.eventService.updateRewardInfo(eventId, rewards, status, userId);
  };

  //유저의 이벤트 보상 확인하는 기능
  @Get('reward-status')
  async getRewardStatus(@Query('eventId') eventId: string, @Req() req: Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('이벤트 보상 확인과정에서 발견된 오류 : JWT 토큰 없음')
    };
    let userId: string;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.sub; // 토큰 안에 포함되어있는 userId를 꺼내옴 payload저장시 sub가 user_id였으므로 sub를 사용
      if (!userId) {
        throw new UnauthorizedException('이벤트 보상 확인과정에서 발견된 오류 : userId 없음')
      };
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('이벤트 보상 확인과정에서 발견된 오류 : JWT 유효하지 않음');
    };

    return this.eventService.getRewardStatus(userId, eventId);
  };

  // 유저가 보상을 요청하는 기능
  @Post('request-reward')
  async requestReward(@Req() req: Request, @Body() body: any) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('보상 요청 중 오류: JWT 토큰 없음');
    };
    let userId = '';
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.sub;
      if (!userId) {
        throw new UnauthorizedException('보상 요청 중 오류: userId 누락');
      };
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('보상 요청 중 오류: JWT 유효하지 않음');
    };

    const { eventId } = body;
    if (!eventId) {
      throw new BadRequestException('eventId는 필수입니다.');
    };

    return await this.eventService.requestReward(userId, eventId);
  }

  @Delete('delete/:id')
  async deleteEvent(@Param('id') id: string, @Req() req: Request) {
    //이미 삭제버튼자체가 ADMIN / OPERATOR만 보이기때문에 따로 Role이나 JWT확인 안하고 삭제기능 작동
    return await this.eventService.deleteEvent(id);
  };

  // 유저가 이벤트에 참여하는 기능
  @Post('userParticipate')
  async userParticipate(@Req() req: Request, @Body() body: any) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('이벤트 참여 중 오류: JWT 토큰 없음');
    };

    let userId: string;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.sub;
      if (!userId) {
        throw new UnauthorizedException('이벤트 참여 중 오류: userId 누락');
      }
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('이벤트 참여 중 오류: JWT 유효하지 않음');
    };

    const { eventId } = body;
    if (!eventId) {
      throw new BadRequestException('eventId는 필수입니다.');
    };

    return await this.eventService.userParticipate(userId, { eventId });
  };

  // 유저의 이벤트 조건 진행도 조회
  @Get('progress')
  async getProgress(@Query('eventId') eventId: string, @Req() req: Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    };

    let userId: string;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.sub;
      if (!userId) {
        throw new UnauthorizedException('userId 누락');
      };
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('JWT 유효하지 않음');
    };

    if (!eventId || typeof eventId !== 'string') {
      throw new BadRequestException('eventId는 필수입니다.');
    };
    const result = await this.eventService.getUserConditionProgress(userId, eventId);
    return result;
  };

  //보상 요청 목록 get
  @Get('requests/:eventId')
  async getRewardRequestsByEvent(@Param('eventId') eventId: string, @Req() req: Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    };

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      var roles = decoded.roles || [];
      if (!roles.includes('ADMIN') && !roles.includes('OPERATOR')) {
        throw new UnauthorizedException('접근 권한이 없습니다.');
      }
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('JWT 유효하지 않음');
    };

    return await this.eventService.getRewardRequestsByEvent(eventId, token);
  };

  //보상 요청 승인 
  @Patch('approve-reward')
  async approveReward(@Req() req: Request, @Body() body: any) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('보상 승인 중 오류: JWT 토큰 없음');
    }

    let approverId: string;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      var roles = decoded.roles;
      approverId = decoded.sub;
      if (!roles.includes('ADMIN') && !roles.includes('OPERATOR')) {
        throw new UnauthorizedException('보상 승인 권한이 없습니다.');
      }
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('보상 승인 중 오류: JWT 유효하지 않음');
    }

    const { userId, eventId } = body;
    if (!userId || !eventId) {
      throw new BadRequestException('보상 승인 중 오류: userId 또는 eventId가 누락되었습니다.');
    }

    return await this.eventService.approveReward(userId, eventId, approverId, token);
  }



  //보상 요청 거절
  @Patch('reject-reward')
  async rejectReward(@Req() req: Request, @Body() body: any) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('보상 거절 중 오류: JWT 토큰 없음');
    }

    let rejectUserId: string;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      var roles = decoded.roles;
      rejectUserId = decoded.sub;
      if (!roles.includes('ADMIN') && !roles.includes('OPERATOR')) {
        throw new UnauthorizedException('보상 거절 권한이 없습니다.');
      }
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('보상 거절 중 오류: JWT 유효하지 않음');
    }

    const { eventId, userId } = body;
    if (!eventId) {
      throw new BadRequestException('보상 거절 중 오류: eventId는 필수입니다.');
    }

    return await this.eventService.rejectReward(userId, eventId);
  }

  // [GET] 거절된 보상 요청 조회 [유저 알림용]
  @Get('rejected-rewards')
  async getRejectedRewards(@Req() req: Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    }

    let userId: string;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.sub;
      if (!userId) {
        throw new UnauthorizedException('JWT에서 userId 누락');
      }
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('유효하지 않은 JWT');
    }

    return await this.eventService.getRejectedRewards(userId);
  }

  // [PATCH] 거절된 보상 알림 확인 처리
  @Patch('rejected-reward/check')
  async checkRejectedRewards(@Req() req: Request, @Body() body: any) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    }

    let userId: string;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.sub;
      if (!userId) {
        throw new UnauthorizedException('JWT에서 userId 누락');
      }
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('유효하지 않은 JWT');
    }

    const { eventIds } = body;
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      throw new BadRequestException('eventIds 배열이 필요합니다.');
    }
    return await this.eventService.markRejectedRewardsChecked(userId, eventIds);
  }


};


// src/user/user.controller.ts
import { Body, Controller, Post, Get, Param, Req, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { SaveRewardHistoryDto } from '../dto/save-reward-history.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register') //회원가입 (생성)
  async register(@Body() body: { username: string; password: string }) {
    return this.userService.register(body.username, body.password);
  };

  @Post('login') //로그인
  async login(@Body() body: { username: string; password: string }) {
    return this.userService.login(body.username, body.password);
  };

  @Get('users')//모든 유저정보 조회
  async getUsers() {
    return this.userService.getAllUsersInfo();
  };
  @Get('users/:id')//유저정보 조회
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserInfo(id);
  };


  /* 전체 유저의 보상 지급/수령 이력을 반환함 [admin/이벤트 운영자 기능] 보상요청이력은 따로 tab이 있으므로 해당 
  페이지는 보상지급이력을 확인하는 페이지로만 설계됨 */
  @Get('reward-requests/history')
  async getAllRewardHistories(@Req() req: Request) {
    return this.userService.getAllRewardHistories();
  }

  @Post('save-reward-history') //유저 보상 저장 ( 해당 기능은 보상 요청이 승인될때 작동함)
  async saveRewardHistory(@Body() dto: SaveRewardHistoryDto) {
    return this.userService.saveRewardHistory(dto);
  };

  @Patch('updateUserRoles') // body값으로 받은 정보를 토대로 유저 role수정
  async updateUserRoles(@Body() body: { userId: string; roles: string[] }) {
    const { userId, roles } = body;
    return this.userService.updateRoles(userId, roles);
  }

};

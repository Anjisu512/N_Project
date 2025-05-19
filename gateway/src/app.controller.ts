import { Controller, Get, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

@Controller()
export class AppController {

  // 로그인한 사용자만 메인 홈(ejs) 접근 가능
  @UseGuards(JwtAuthGuard)
  @Get()
  async getHomePage(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.access_token;

    let username = '유저정보 조회 실패';
    let roles = ['NONE']; // 기본값 설정
    let rejectedNotice = [];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        username = decoded.username || '알 수 없음';        
        roles = decoded.roles || 'USER'; //  
        // Event 서버의 /event/rejected-rewards 호출 => 로그아웃 => 로그인 사이에 거절된 혹은 로그인중에라도 home으로 이동할경우 거절된 이벤트 확인
        const response = await axios.get('http://event:3000/rejected-rewards', {
          headers: {
            Cookie: `access_token=${token}`
          }
        });
        rejectedNotice = response.data;
      } catch (err) {
        console.warn('JWT 검증 실패 또는 보상 거절 알림 조회 실패:', err.message);
      }
    }

    return res.render('main', {
      user: { username, roles }, //role
      rejectedNotice //만약 이벤트 보상 거절알림이 존재한다면
    });
  }

  // 로그인 페이지
  @Get('/login')
  getLoginPage(@Res() res: Response) {
    return res.render('login'); // login.ejs 사용
  }

  // 로그아웃 기능 => JWT 토큰 삭제 후 로그인 페이지로 이동
  @Get('/logout')
  userLogout(@Res() res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: false, // https인경우 true로 설정
    });

    return res.redirect('/login');
  }

  //마이페이지 (로그인만 하면됨)
  @UseGuards(JwtAuthGuard)
  @Get('/myPage')
  async getMyPage(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const username = decoded.username || 'Unknown';
      const userId = decoded.sub;
      const roles = decoded.roles || [];  

      // 사용자 정보 전달하여 EJS나 템플릿 렌더링 가능
      return res.render('myPage', { user: { username, userId,roles } }); // userName과 id보내기
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('유효하지 않은 JWT 토큰입니다.');
    }
  }

  // 관리자 페이지
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  @Get('/adminPage')
  getAdminPage(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 없습니다.');
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const username = decoded.username || 'Unknown';
      const userId = decoded.sub;
      const roles = decoded.roles || [];
      return res.render('adminPage', { user: { username, userId,roles } });
    } catch (err) {
      console.warn('JWT 검증 실패:', err.message);
      throw new UnauthorizedException('유효하지 않은 JWT 토큰입니다.');
    }
  }

  // 회원가입 페이지
  @Get('/register')
  getRegisterPage(@Res() res: Response) {
    return res.render('register'); // register.ejs 사용
  }

  //보상 이력 관리 페이지[admin,운영자,AUDITOR]
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR','AUDITOR')
  @Get('rewardHistory')
  async getRewardHistory(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies?.access_token;
      let user = { username: '알 수 없음', roles:[] };

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user.username = decoded.username || '알 수 없음';
        user.roles = decoded.roles || [];
      };

      // 이벤트 목록은 ejs가 렌더된 뒤 js로 호출예정
      return res.render('rewardHistory', { user });

    } catch (error) {
      console.error('보상 이력 페이지 조회 실패:', error?.response?.data || error.message);
      return res.render('rewardManager', { user: { username: '유저정보 조회 실패' } });
    };
  }

  // 보상등록 / 조회 페이지
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  @Get('rewardManager')
  async getRewardManger(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies?.access_token;
      let user = { username: '알 수 없음', roles: []};

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user.username = decoded.username || '알 수 없음';
        user.roles = decoded.roles || [];  
      };

      // 이벤트 목록은 js에서 별도로 fetch로 event서버 호출예정
      return res.render('rewardManager', { user });

    } catch (error) {
      console.error('보상등록 페이지 유저 조회 실패:', error?.response?.data || error.message);
      return res.render('rewardManager', { user: { username: '유저정보 조회 실패' } });
    };
  }

  // 보상요청 페이지
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'USER')
  @Get('requestReward')
  async getRequestReward(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies?.access_token;
      let user = { username: '알 수 없음' , roles:[] };

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user.username = decoded.username || '알 수 없음';
        user.roles = decoded.roles || [];
      };

      // 이벤트 목록은 js에서 별도로 fetch로 event서버 호출예정
      return res.render('requestReward', { user });

    } catch (error) {
      console.error('보상 요청 페이지 유저 조회 실패:', error?.response?.data || error.message);
      return res.render('requestReward', {
        user: { username: '유저정보 조회 실패' }
      });
    };
  };


  // 보상 요청 처리 페이지 (관리자/운영자만 접근 가능)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  @Get('rewardAction')
  async getRewardManage(@Req() req: Request, @Res() res: Response) {
    try {
      //관리자 페이지여도 operator 혹은 admin의 분기가 필요할 수 있으니 token내 user정보를 확인
      const token = req.cookies?.access_token;
      let user = { username: '알 수 없음', roles : [] };

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user.username = decoded.username || '알 수 없음';
        user.roles = decoded.roles || []; 
      }
      return res.render('rewardAction', { user });
    } catch (error) {
      console.error('보상 요청 처리 페이지 유저 조회 실패:', error?.response?.data || error.message);
      return res.render('rewardAction', {
        user: { username: '유저정보 조회 실패' }
      });
    }
  };

}
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

/**
 * 이 Guard는 jwt.strategy.ts의 JwtStrategy를 실행하고,
 * 유효하면 req.user를 넣어주는 역할을 함
 * jwt.strategy.ts에 이름은 custom-jwt로 설정했기에 아래와 같이 넣어줌
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('custom-jwt') {

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const url = request.url;

    console.log('## JwtAuthGuard Start');

    //정적 자원은 Guard 통과 

    if ( url.startsWith('/css') || url.startsWith('/img') || url.startsWith('/js') || url.startsWith('/favicon') ) {
      return true;
    }
    const ignoredPaths = ['/login', '/auth/login', '/register','/auth/register']; // 예외 경로
    if (ignoredPaths.includes(request.path)) {
      return true; // 예외 경로는 Guard 통과
    };
    return super.canActivate(context);
  };

  handleRequest(err, user, info, context: ExecutionContext) {
    console.log('## JWT handleRequest 호출됨');

    const response = context.switchToHttp().getResponse();

    if (err || !user) { //user가 없거나 err인경우는 login페이지로 강제이동
      console.log('## JWT 실패 → login 리디렉션');

      response.redirect('/login');
      throw new UnauthorizedException('## JWT 인증 실패'); //추가 action이 진행되지 않도록 throw exception
    };
    return user;
  };
}; 
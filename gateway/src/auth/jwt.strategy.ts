import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'custom-jwt') {
    constructor(private readonly configService: ConfigService) { //환경변수 JWT_SECRET를 가져오기위해 constructor로 받아옴
        super({
            // Authorization 헤더에서 Bearer 토큰 추출
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => req?.cookies?.['access_token'], // 쿠키에서 jwt발급토큰 꺼냄
            ]),
            // 토큰 만료 여부도 자동 확인 (false로 설정하면 토큰 만료 시간이 지났을 경우 자동으로 거부)
            ignoreExpiration: false,

            // JWT를 decode할 때 사용할 비밀 키 => 주의 : .env의 JWT_SECRET 값은 auth 서버에서 토큰을 만들 때 쓴 키와 같아야 함.
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    // 토큰이 유효할 때 실행되는 기능
    async validate(payload: any) {
        /**
         * payload는 JWT에 담긴 내용
         * 예: { sub: 'user_id', email: 'user@email.com', role: 'USER' }
         * 
         * 이 리턴값은 요청 객체(req.user)에 들어감
         */
        return {
            userId: payload.sub,
            email: payload.email,
            roles: payload.roles,
        };
    }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // console.log('✔ RolesGuard에 진입하였습니다.');

    // 예외 경로 (role 검사 무시)
    const request = context.switchToHttp().getRequest();
    const path = request.path;
    const ignoredPaths = ['/login', '/auth/login', '/register', '/auth/register'];
    if (ignoredPaths.includes(path)) {
      console.log('✔ 예외 경로에 진입하였습니다. RolesGuard는 작동되지 않습니다. path:' + path);
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // console.log('✔ Roles 유효성 Check합니다. 필요 roles:', requiredRoles);

    // @Roles() 데코레이터가 없으면 통과
    if (!requiredRoles) {
      return true;
    }

    const response: Response = context.switchToHttp().getResponse();
    const user = request.user;

    // JwtAuthGuard가 먼저 실행되므로 user는 항상 있음이 보장됨
    // 굳이 user null 체크할 필요 없음
    const hasRequiredRole = user.roles.some((role: string) =>
      requiredRoles.includes(role),
    );
    
    if (!hasRequiredRole) {
      console.log(`✔ 권한 부족: 필요=${requiredRoles}, 현재=${user.roles}`);
      response.status(403).send(`
        <script>
          alert("접근 권한이 없습니다.");
          window.location.href = "/";
        </script>
      `);
      return false;
    }

    //권한 통과
    // console.log('✔ 권한 통과: 역할 =', user.roles);
    return true;
  }
}

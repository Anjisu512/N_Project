import { SetMetadata } from '@nestjs/common';

/** ex) @Roles('ADMIN') → Reflector를 통해 'roles' 값으로 조회 가능 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

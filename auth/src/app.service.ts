import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument,UserRole } from './user/user.schema';

@Injectable()
export class AppService implements OnModuleInit {
  
  constructor( @InjectModel(User.name) private readonly userModel: Model<UserDocument>, ) {}

  async onModuleInit() {
    //설정하려는 admin계정의 비밀번호는 .env에서 수정가능 null이라면 admin 으로 default설정
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    const admin = await this.userModel.findOne({ username: 'admin' });

    //admin계정이 없는경우 생성
    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await this.userModel.create({
        username: 'admin',
        password: hashedPassword,
        roles: [UserRole.ADMIN],
      });
      console.log('[ADMIN 계정 생성] username: admin / password: (env value)');
    } else {
      // env파일에서 기존 admin 계정의 비밀번호가 변경되었는지 확인 
      const isSame = await bcrypt.compare(adminPassword, admin.password);
      if (!isSame) {
        const newHashed = await bcrypt.hash(adminPassword, 10);
        admin.password = newHashed;
        await admin.save();
        console.log('[ADMIN 계정 비밀번호 업데이트됨] password: (env value)');
      } else {
        console.log('[ADMIN 계정 존재 확인] 비밀번호도 동일, 변경 없음');
      }
    }
  }
}

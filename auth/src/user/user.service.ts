import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument,UserRole} from './user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SaveRewardHistoryDto } from '../dto/save-reward-history.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>, private jwtService: JwtService,) { }


  //유저 등록
  async register(username: string, password: string) {
    const exists = await this.userModel.findOne({ username });
    if (exists) {
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }
    const hashedPassword = await bcrypt.hash(password, 10); // 10은 bcrypt해싱강도 10~12정도로 하면 적당하다함
    const user = new this.userModel({
      username,
      password: hashedPassword,
      roles: [UserRole.USER], //유저는 기본 Role 부여
    });

    await user.save();
    return { message: '회원가입 성공' };
  }

  //유저 로그인
  async login(username: string, password: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }

    //bcrypt로 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }

    const payload = {
      sub: user._id,
      username: user.username,
      roles: user.roles, //토큰에 역할도 포함
    };

    const accessToken = this.jwtService.sign(payload); // JWT 발급
    return {
      message: '로그인 성공',
      accessToken,
    };
  };

  //모든 유저 정보 조회
  async getAllUsersInfo(): Promise<User[]> {
    const user = await this.userModel.find().lean();
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    };
    return user
  }

  //유저 정보 조회
  async getUserInfo(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    };
    return { username: user.username, role: user.roles, userData: user }; //마이페이지를 나중에만든관계로 userData라는 리턴값 추가
  };

  //전체 유저의 보상이력 확인하는 기능 [admin/운영자]
  async getAllRewardHistories() {
    // rewardHistory가 존재하는 유저만 조회
    const users = await this.userModel
      .find({
        rewardHistories: {
          $exists: true, $not: {
            $size: 0
          }
        }
      })
      .lean();
    const histories = users.flatMap(user =>
      user.rewardHistories.map(h => ({
        username: user.username,
        eventTitle: h.eventTitle,
        rewards: h.rewards,
        requestedAt: h.requestedAt,
        approvedAt: h.approvedAt,
      }))
    );
    return histories;
  };


  //유저 보상 저장 ( 해당 기능은 보상 요청이 승인될때 작동함)
  async saveRewardHistory(dto: SaveRewardHistoryDto) {
    const user = await this.userModel.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('User를 찾을 수 없습니다.');
    };

    user.rewardHistories.push({
      eventId: dto.eventId,
      eventTitle: dto.eventTitle,
      rewards: dto.rewards,
      approvedAt: new Date(dto.approvedAt),
      requestedAt: new Date(dto.requestedAt),
    });

    await user.save();
    return { message: '보상 이력 저장 완료' };
  };

  //유저의 Role수정하는기능 
  async updateRoles(userId: string, roles: string[]): Promise<User> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 유효한 Role만 필터링 (선택)
    const validRoles = Object.values(UserRole);
    const invalidRoles = roles.filter(role => !validRoles.includes(role as UserRole));

    if (invalidRoles.length > 0) {
      throw new BadRequestException(`유효하지않은 Role입니다 =>  ${invalidRoles.join(', ')}`);
    }

    user.roles = roles as UserRole[]; // 타입 캐스팅
    return await user.save();
  }
}
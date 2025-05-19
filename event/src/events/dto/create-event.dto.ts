import { IsString, IsDateString, IsIn, IsOptional, IsNumber, IsNotEmpty, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// 보상을 배열로 변경하여 DTO화
class RewardDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;
};

// 이벤트 생성 요청의 형식을 정의하는 DTO
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsOptional()
  @IsString()
  custom_condition?: string;

  @Type(() => Number)
  @IsNumber()
  value: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  // 다중으로 변경 rewards
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardDto)
  rewards?: RewardDto[];

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
};

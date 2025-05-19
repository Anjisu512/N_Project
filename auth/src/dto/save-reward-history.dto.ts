
import { IsString, IsArray, IsDateString, ValidateNested, IsNotEmpty, IsNumber, Min, } from 'class-validator';
import { Type } from 'class-transformer';

//event의 schema/model과 통일
class RewardDto {
    @IsString()
    @IsNotEmpty()
    type: string;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    amount: number;
     
}; 
export class SaveRewardHistoryDto {
    @IsString()
    userId: string;

    @IsString()
    eventId: string;

    @IsString()
    eventTitle: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RewardDto)
    rewards: RewardDto[];

    @IsDateString()
    approvedAt: string;

    @IsDateString()
    requestedAt: string;
    
};

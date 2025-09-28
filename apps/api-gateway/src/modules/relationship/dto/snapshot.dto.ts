import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class GetFollowersSnapshotLastMonthDto {
  @ApiProperty({
    description: 'User ID to get followers snapshot data for',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;
}

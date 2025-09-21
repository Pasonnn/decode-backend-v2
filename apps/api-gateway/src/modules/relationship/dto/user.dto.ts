import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserDto {
  @ApiProperty({
    description: 'User ID to get relationship information for',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}

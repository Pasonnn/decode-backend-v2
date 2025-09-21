import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MutualDto {
  @ApiProperty({
    description: 'User ID to get mutual followers with',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  user_id_to: string;
}

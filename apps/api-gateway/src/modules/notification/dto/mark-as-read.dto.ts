import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '64f1b2c3d4e5f6a7b8c9d0e1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for marking notification as read
 */
export class MarkReadDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  notificationId: string;
}

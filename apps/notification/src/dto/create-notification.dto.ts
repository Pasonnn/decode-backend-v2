import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { IsDate } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsBoolean()
  @IsNotEmpty()
  delivered: boolean;

  @IsDate()
  @IsNotEmpty()
  delivered_at: Date;

  @IsBoolean()
  @IsNotEmpty()
  read: boolean;

  @IsDate()
  @IsNotEmpty()
  read_at: Date;
}

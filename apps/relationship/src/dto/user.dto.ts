import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { USER_CONSTANTS } from '../constants/user.constants';

export class GetUserDto {
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}

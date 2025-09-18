import { IsString, IsNotEmpty, IsNumber, Matches, Min } from 'class-validator';
import { USER_CONSTANTS } from '../constants/user.constants';

export class BlockDto {
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  @IsString()
  @IsNotEmpty()
  user_id_to: string;
}

export class UnblockDto extends BlockDto {}

export class CheckIfUserBlockedDto extends BlockDto {}

export class GetBlockedUsersDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  limit: number;
}

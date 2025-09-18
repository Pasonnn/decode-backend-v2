import { IsString, IsNotEmpty, IsNumber, Matches, Min } from 'class-validator';
import { USER_CONSTANTS } from '../constants/user.constants';

export class FollowDto {
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  @IsString()
  @IsNotEmpty()
  user_id_to: string;
}

export class UnfollowDto extends FollowDto {}

export class RemoveFollowerDto extends FollowDto {}

export class CheckIfUserFollowingDto extends FollowDto {}

export class GetFollowingDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  limit: number;
}

export class GetFollowersDto extends GetFollowingDto {}

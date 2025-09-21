import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FollowDto {
  @ApiProperty({
    description: 'User ID to follow',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  user_id_to: string;
}

export class UnfollowDto {
  @ApiProperty({
    description: 'User ID to unfollow',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  user_id_to: string;
}

export class RemoveFollowerDto {
  @ApiProperty({
    description: 'User ID to remove as follower',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  user_id_to: string;
}

export class GetFollowingDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class GetFollowersDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

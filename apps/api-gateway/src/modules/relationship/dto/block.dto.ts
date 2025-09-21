import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockDto {
  @ApiProperty({
    description: 'User ID to block',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  user_id_to: string;
}

export class UnblockDto {
  @ApiProperty({
    description: 'User ID to unblock',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  user_id_to: string;
}

export class GetBlockedUsersDto {
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

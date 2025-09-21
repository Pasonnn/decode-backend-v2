import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchFollowersDto {
  @ApiPropertyOptional({
    description: 'Search parameters for followers',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  params?: string;

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

export class SearchFollowingDto {
  @ApiPropertyOptional({
    description: 'Search parameters for following',
    example: 'jane',
  })
  @IsOptional()
  @IsString()
  params?: string;

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

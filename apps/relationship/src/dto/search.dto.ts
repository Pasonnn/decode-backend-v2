import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class SearchFollowersDto {
  @IsString()
  @IsNotEmpty()
  params: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  limit: number;
}

export class SearchFollowingDto extends SearchFollowersDto {}

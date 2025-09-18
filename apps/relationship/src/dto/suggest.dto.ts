import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class GetSuggestionsPaginatedDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  limit: number;
}

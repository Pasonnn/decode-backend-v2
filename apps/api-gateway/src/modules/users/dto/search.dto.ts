import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, MinLength, MaxLength, IsNotEmpty, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SearchField {
  USERNAME = 'username',
  DISPLAY_NAME = 'display_name',
  BIOGRAPHY = 'bio',
}

export class SearchUserDto {
  @ApiProperty({
    description: 'Search query (username or email)',
    example: 'john',
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  username_or_email?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Search in specific fields',
    example: ['username', 'display_name'],
    enum: SearchField,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(SearchField, { each: true })
  fields?: SearchField[];

  @ApiProperty({
    description: 'Sort field',
    example: 'username',
    enum: SearchField,
    required: false,
  })
  @IsOptional()
  @IsEnum(SearchField)
  sortBy?: SearchField = SearchField.USERNAME;

  @ApiProperty({
    description: 'Sort order',
    example: 'asc',
    enum: SortOrder,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}

export class SearchUsernameDto {
  @ApiProperty({
    description: 'Username to search for',
    example: 'john_doe',
    minLength: 3,
    maxLength: 30,
    pattern: '^[a-zA-Z0-9_]+$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  username: string;
}

export class SearchEmailDto {
  @ApiProperty({
    description: 'Email to search for',
    example: 'john.doe@example.com',
    minLength: 5,
    maxLength: 254,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(254)
  @IsEmail()
  email: string;
}

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_CONSTANTS } from '../constants/user.constants';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SearchField {
  USERNAME = 'username',
  DISPLAY_NAME = 'display_name',
  BIOGRAPHY = 'biography',
}

export class SearchUserDto {
  @ApiProperty({
    description: 'Search query (username or email)',
    example: 'john',
    minLength: USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH,
    maxLength: USER_CONSTANTS.SEARCH.MAX_QUERY_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH)
  @MaxLength(USER_CONSTANTS.SEARCH.MAX_QUERY_LENGTH)
  username_or_email?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: USER_CONSTANTS.SEARCH.MIN_PAGE,
    default: USER_CONSTANTS.SEARCH.DEFAULT_PAGE,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(USER_CONSTANTS.SEARCH.MIN_PAGE)
  @Max(USER_CONSTANTS.PAGINATION.MAX_PAGE)
  page?: number = USER_CONSTANTS.SEARCH.DEFAULT_PAGE;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
    minimum: USER_CONSTANTS.SEARCH.MIN_LIMIT,
    maximum: USER_CONSTANTS.SEARCH.MAX_LIMIT,
    default: USER_CONSTANTS.SEARCH.DEFAULT_LIMIT,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(USER_CONSTANTS.SEARCH.MIN_LIMIT)
  @Max(USER_CONSTANTS.SEARCH.MAX_LIMIT)
  limit?: number = USER_CONSTANTS.SEARCH.DEFAULT_LIMIT;

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
    minLength: USER_CONSTANTS.USERNAME.MIN_LENGTH,
    maxLength: USER_CONSTANTS.USERNAME.MAX_LENGTH,
    pattern: '^[a-zA-Z0-9_]+$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.USERNAME.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.USERNAME.MAX_LENGTH)
  @Matches(USER_CONSTANTS.USERNAME.PATTERN, {
    message: 'Username must contain only letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: USER_CONSTANTS.SEARCH.MIN_PAGE,
    default: USER_CONSTANTS.SEARCH.DEFAULT_PAGE,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(USER_CONSTANTS.SEARCH.MIN_PAGE)
  @Max(USER_CONSTANTS.PAGINATION.MAX_PAGE)
  page?: number = USER_CONSTANTS.SEARCH.DEFAULT_PAGE;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
    minimum: USER_CONSTANTS.SEARCH.MIN_LIMIT,
    maximum: USER_CONSTANTS.SEARCH.MAX_LIMIT,
    default: USER_CONSTANTS.SEARCH.DEFAULT_LIMIT,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(USER_CONSTANTS.SEARCH.MIN_LIMIT)
  @Max(USER_CONSTANTS.SEARCH.MAX_LIMIT)
  limit?: number = USER_CONSTANTS.SEARCH.DEFAULT_LIMIT;
}

export class SearchEmailDto {
  @ApiProperty({
    description: 'Email to search for',
    example: 'john.doe@example.com',
    minLength: USER_CONSTANTS.EMAIL.MIN_LENGTH,
    maxLength: USER_CONSTANTS.EMAIL.MAX_LENGTH,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.EMAIL.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.EMAIL.MAX_LENGTH)
  @Matches(USER_CONSTANTS.EMAIL.PATTERN, {
    message: 'Invalid email format',
  })
  email: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: USER_CONSTANTS.SEARCH.MIN_PAGE,
    default: USER_CONSTANTS.SEARCH.DEFAULT_PAGE,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(USER_CONSTANTS.SEARCH.MIN_PAGE)
  @Max(USER_CONSTANTS.PAGINATION.MAX_PAGE)
  page?: number = USER_CONSTANTS.SEARCH.DEFAULT_PAGE;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
    minimum: USER_CONSTANTS.SEARCH.MIN_LIMIT,
    maximum: USER_CONSTANTS.SEARCH.MAX_LIMIT,
    default: USER_CONSTANTS.SEARCH.DEFAULT_LIMIT,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(USER_CONSTANTS.SEARCH.MIN_LIMIT)
  @Max(USER_CONSTANTS.SEARCH.MAX_LIMIT)
  limit?: number = USER_CONSTANTS.SEARCH.DEFAULT_LIMIT;
}

export class SearchUsernameOrEmailDto {
  @ApiProperty({
    description: 'Username or email to search for',
    example: 'john_doe',
    minLength: USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH,
    maxLength: USER_CONSTANTS.SEARCH.MAX_QUERY_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH)
  @MaxLength(USER_CONSTANTS.SEARCH.MAX_QUERY_LENGTH)
  username_or_email: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: USER_CONSTANTS.SEARCH.MIN_PAGE,
    default: USER_CONSTANTS.SEARCH.DEFAULT_PAGE,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(USER_CONSTANTS.SEARCH.MIN_PAGE)
  @Max(USER_CONSTANTS.PAGINATION.MAX_PAGE)
  page?: number = USER_CONSTANTS.SEARCH.DEFAULT_PAGE;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
    minimum: USER_CONSTANTS.SEARCH.MIN_LIMIT,
    maximum: USER_CONSTANTS.SEARCH.MAX_LIMIT,
    default: USER_CONSTANTS.SEARCH.DEFAULT_LIMIT,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(USER_CONSTANTS.SEARCH.MIN_LIMIT)
  @Max(USER_CONSTANTS.SEARCH.MAX_LIMIT)
  limit?: number = USER_CONSTANTS.SEARCH.DEFAULT_LIMIT;
}

export class GetUserSuggestionsDto {
  @ApiProperty({
    description: 'Number of suggestions to return',
    example: 10,
    minimum: 1,
    maximum: USER_CONSTANTS.SEARCH.MAX_SUGGESTIONS,
    default: USER_CONSTANTS.SEARCH.SUGGESTIONS_LIMIT,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(USER_CONSTANTS.SEARCH.MAX_SUGGESTIONS)
  limit?: number = USER_CONSTANTS.SEARCH.SUGGESTIONS_LIMIT;

  @ApiProperty({
    description: 'Exclude current user from suggestions',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  excludeCurrentUser?: boolean = true;

  @ApiProperty({
    description: 'Filter by location',
    example: 'San Francisco',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;
}

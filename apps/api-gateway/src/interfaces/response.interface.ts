import { ApiProperty } from '@nestjs/swagger';

export interface Response<T = unknown> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    error?: string | Record<string, unknown>;
}

export class ApiResponseDto<T = unknown> {
    @ApiProperty({
        description: 'Indicates if the request was successful',
        example: true
    })
    success: boolean;

    @ApiProperty({
        description: 'HTTP status code',
        example: 200
    })
    statusCode: number;

    @ApiProperty({
        description: 'Response message',
        example: 'Operation completed successfully'
    })
    message: string;

    @ApiProperty({
        description: 'Response data payload',
        required: false
    })
    data?: T;

    @ApiProperty({
        description: 'Error details if request failed',
        required: false
    })
    error?: string | Record<string, unknown>;
}

export class ErrorResponseDto {
    @ApiProperty({
        description: 'Indicates if the request was successful',
        example: false
    })
    success: boolean;

    @ApiProperty({
        description: 'HTTP status code',
        example: 400
    })
    statusCode: number;

    @ApiProperty({
        description: 'Error message',
        example: 'Bad Request'
    })
    message: string;

    @ApiProperty({
        description: 'Error details',
        example: 'Validation failed'
    })
    error: string | Record<string, unknown>;
}
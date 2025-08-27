import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
    @IsNotEmpty()
    @IsString()
    session_token: string;
}

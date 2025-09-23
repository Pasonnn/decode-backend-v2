import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

class CheckUserExistsByEmailOrUsernameDto {
  @ApiProperty({
    description: 'Email or username',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsString()
  email_or_username: string;
}

class CreateUserDto {
  @ApiProperty({
    description: 'Email',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Password',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  password_hashed: string;
}

class ChangePasswordDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'Password',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  password_hashed: string;
}

class GetInfoByEmailOrUsernameDto extends CheckUserExistsByEmailOrUsernameDto {}

class GetInfoByUserIdDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;
}

class GetInfoWithPasswordByUserIdDto extends GetInfoByUserIdDto {}

class UpdateUserLastLoginDto extends GetInfoByUserIdDto {}

export {
  CheckUserExistsByEmailOrUsernameDto,
  CreateUserDto,
  ChangePasswordDto,
  GetInfoByEmailOrUsernameDto,
  GetInfoByUserIdDto,
  GetInfoWithPasswordByUserIdDto,
  UpdateUserLastLoginDto,
};

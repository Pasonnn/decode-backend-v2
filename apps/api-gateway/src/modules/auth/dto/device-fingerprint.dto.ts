import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for revoking a device fingerprint
 */
export class RevokeDeviceFingerprintDto {
  @ApiProperty({
    description: 'Device fingerprint ID to revoke',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
    required: true,
  })
  @IsNotEmpty({
    message: 'Device fingerprint ID is required',
  })
  @IsString({
    message: 'Device fingerprint ID must be a string',
  })
  device_fingerprint_id: string;
}

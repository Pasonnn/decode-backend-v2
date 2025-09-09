import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeDeviceFingerprintDto {
  @IsNotEmpty()
  @IsString()
  device_fingerprint_id: string;
}

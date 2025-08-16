import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';

// Schemas Import
import { User } from '../schemas/user.schema';
import { DeviceFingerprint } from '../schemas/device_fingerprint.schema';
import { Session } from '../schemas/session.schema';

// Interfaces Import
import { Response } from '../interfaces/response.interface';

// Infrastructure and Strategies Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PasswordUtils } from '../utils/password.utils';

@Injectable()
export class LoginService {
    private readonly logger: Logger;
    constructor(
        private readonly configService: ConfigService,
        private readonly passwordUtils: PasswordUtils,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(DeviceFingerprint.name) private deviceFingerprintModel: Model<DeviceFingerprint>,
        @InjectModel(Session.name) private sessionModel: Model<Session>,
        private readonly redisInfrastructure: RedisInfrastructure,
    ) {
        this.logger = new Logger(LoginService.name);
    }

    // login/
    async login(email_or_username: string, password: string, fingerprint_hashed: string): Promise<Response> {
        this.logger.log(`Login request received for ${email_or_username}`);
        const getUserInfoResponse = await this.getUserInfo(email_or_username);
        if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
            return getUserInfoResponse;
        }
        const checkPasswordResponse = await this.checkPassword(password, getUserInfoResponse.data.password_hashed);
        if (!checkPasswordResponse.success) {
            return checkPasswordResponse;
        }
        const checkDeviceFingerprintResponse = await this.checkDeviceFingerprint(fingerprint_hashed);
        if (!checkDeviceFingerprintResponse.success) { // Device fingerprint not trusted
            this.logger.log(`Device fingerprint not trusted for ${email_or_username}`);
            const createDeviceFingerprintResponse = await this.createDeviceFingerprint(getUserInfoResponse.data._id, fingerprint_hashed);
            if (!createDeviceFingerprintResponse.success) {
                this.logger.error(`Cannot create device fingerprint for ${email_or_username}`);
                return createDeviceFingerprintResponse;
            }
            const sendDeviceFingerprintEmailVerificationResponse = await this.sendDeviceFingerprintEmailVerification(getUserInfoResponse.data._id, fingerprint_hashed);
            if (!sendDeviceFingerprintEmailVerificationResponse.success) {
                this.logger.error(`Cannot send device fingerprint email verification for ${email_or_username}`);
                return sendDeviceFingerprintEmailVerificationResponse;
            }
            this.logger.log(`Device fingerprint email verification sent for ${email_or_username}`);
            return {
                success: true,
                statusCode: 400,
                message: 'Device fingerprint not trusted, send email verification',
            };
        } else { // Device fingerprint trusted
            this.logger.log(`Device fingerprint trusted for ${email_or_username}`);
            const createSessionResponse = await this.createSession(getUserInfoResponse.data._id, checkDeviceFingerprintResponse.data._id);
            if (!createSessionResponse.success) {
                this.logger.error(`Cannot create session for ${email_or_username}`);
                return createSessionResponse;
            }
            this.logger.log(`Session created for ${email_or_username}`);
            return {
                success: true,
                statusCode: 200,
                message: 'Login successful',
                data: createSessionResponse.data,
            };
        }
    }

    async verifyDeviceFingerprintEmailVerification(email_verification_code: string): Promise<Response> {
        this.logger.log(`Verify device fingerprint email verification request received for ${email_verification_code}`);
        const validateDeviceFingerprintEmailVerificationResponse = await this.validateDeviceFingerprintEmailVerification(email_verification_code);
        if (!validateDeviceFingerprintEmailVerificationResponse.success || !validateDeviceFingerprintEmailVerificationResponse.data) {
            return validateDeviceFingerprintEmailVerificationResponse;
        }
        this.logger.log(`Device fingerprint verification successful for ${email_verification_code}`);
        return {
            success: true,
            statusCode: 200,
            message: 'Device fingerprint verification successful',
        };
    }

    private async getUserInfo(email_or_username: string): Promise<Response> {
        // Check if user exists
        const user = await this.userModel.findOne({ $or: [{ email: email_or_username }, { username: email_or_username }] });
        if (!user) {
            return {
                success: false,
                statusCode: 400,
                message: 'User not found',
            }
        }
        return {
            success: true,
            statusCode: 200,
            message: 'User info checked',
            data: user,
        }
    }

    private async checkPassword(password: string, password_hashed: string): Promise<Response> {
        // Check if password is correct
        const is_password_correct = await this.passwordUtils.comparePassword(password, password_hashed);
        if (!is_password_correct) {
            return {
                success: false,
                statusCode: 400,
                message: 'Invalid password',
            };
        }
        return {
            success: true,
            statusCode: 200,
            message: 'Password is correct',
        };
    }

    private async checkDeviceFingerprint(fingerprint_hashed: string): Promise<Response> {
        // Check if device fingerprint is correct
        const device_fingerprint = await this.deviceFingerprintModel.findOne({ fingerprint_hashed: fingerprint_hashed });
        if (!device_fingerprint || device_fingerprint.is_trusted === false) {
            return {
                success: false,
                statusCode: 400,
                message: 'Device fingerprint not found',
            };
        }
        return {
            success: true,
            statusCode: 200,
            message: 'Device fingerprint is trusted',
            data: device_fingerprint,
        };
    }

    private async createDeviceFingerprint(user_id: string, fingerprint_hashed: string): Promise<Response> {
        // Create device fingerprint
        const device_fingerprint = await this.deviceFingerprintModel.create(
            { 
                user_id: user_id, 
                fingerprint_hash: fingerprint_hashed, 
                is_trusted: false,
            }
        );
        return {
            success: true,
            statusCode: 200,
            message: 'Device fingerprint created',
            data: device_fingerprint,
        };
    }

    private async sendDeviceFingerprintEmailVerification(user_id: string, fingerprint_hashed: string): Promise<Response> {
        // Send device fingerprint email verification
        const device_fingerprint_email_verification = await this.deviceFingerprintModel.findOne({ 
            $and: [
                { user_id: user_id }, 
                { fingerprint_hash: fingerprint_hashed }
            ] 
        });
        if (!device_fingerprint_email_verification) {
            return {
                success: false,
                statusCode: 400,
                message: 'Device fingerprint not found',
            };
        }
        // Send email verification code to user
        const email_verification_code = uuidv4().slice(0, 6); // 6 random characters
        // Store email verification code with email in Redis
        const fingerprint_email_verification_code_key = `fingerprint-email-verification:${email_verification_code}`;
        const fingerprint_email_verification_code_value = {
            user_id: user_id,
            fingerprint_hash: fingerprint_hashed,
        }
        await this.redisInfrastructure.set(
            fingerprint_email_verification_code_key,
            JSON.stringify(fingerprint_email_verification_code_value), 60 * 5
        ); // 5 minutes
        return {
            success: true,
            statusCode: 200,
            message: 'Device fingerprint email verification sent',
        };
    }

    private async validateDeviceFingerprintEmailVerification(email_verification_code: string): Promise<Response> {
        // Validate device fingerprint email verification
        const device_fingerprint_data = await this.redisInfrastructure.get(email_verification_code);
        if (!device_fingerprint_data) {
            return {
                success: false,
                statusCode: 400,
                message: 'Invalid email verification code',
            };
        }
        // Find device fingerprint in database
        let device_fingerprint = await this.deviceFingerprintModel.findOne({ 
            $and: [
                { user_id: device_fingerprint_data.user_id },
                { fingerprint_hash: device_fingerprint_data.fingerprint_hash }
            ]
        });
        if (!device_fingerprint) {
            // Create device fingerprint in database
            const createDeviceFingerprintResponse = await this.createDeviceFingerprint(
                device_fingerprint_data.user_id, 
                device_fingerprint_data.fingerprint_hash
            );
            if (!createDeviceFingerprintResponse.success) {
                return {
                    success: false,
                    statusCode: 400,
                    message: 'Cannot create device fingerprint',
                };
            }
            device_fingerprint = createDeviceFingerprintResponse.data;
        }
        // Update device fingerprint to trusted
        device_fingerprint.is_trusted = true;
        await device_fingerprint.save();
        // Delete email verification code from Redis
        await this.redisInfrastructure.del(email_verification_code);
        return {
            success: true,
            statusCode: 200,
            message: 'Device fingerprint email verification verified',
            data: device_fingerprint,
        };
    }

    private async createSession(user_id: string, device_fingerprint_id: string): Promise<Response> {
        // Create session
        const session = await this.sessionModel.create({
            user_id: user_id,
            device_fingerprint_id: device_fingerprint_id,
        });
        return {
            success: true,
            statusCode: 200,
            message: 'Session created',
            data: session,
        };
    }
}
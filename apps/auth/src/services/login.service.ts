import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';

// Schemas Import
import { User } from '../schemas/user.schema';
import { DeviceFingerprint } from '../schemas/device-fingerprint.schema';
import { Session } from '../schemas/session.schema';

// Interfaces Import
import { Response, LoginResponse } from '../interfaces/response.interface';
import { UserDoc, DeviceFingerprintDoc } from '../interfaces/login.interface';
import { SessionDoc } from '../interfaces/session.interface';

// Infrastructure and Strategies Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PasswordUtils } from '../utils/password.utils';

// Services Import
import { SessionService } from './session.service';

@Injectable()
export class LoginService {
    private readonly logger: Logger;
    constructor(
        private readonly configService: ConfigService,
        private readonly passwordUtils: PasswordUtils,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(DeviceFingerprint.name) private deviceFingerprintModel: Model<DeviceFingerprint>,
        @InjectModel(Session.name) private sessionModel: Model<Session>,
        private readonly sessionService: SessionService,
        private readonly redisInfrastructure: RedisInfrastructure,
        private readonly jwtStrategy: JwtStrategy,
        @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
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
        if (!checkDeviceFingerprintResponse.success || !checkDeviceFingerprintResponse.data) { // Device fingerprint not trusted
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
            if (!createSessionResponse.success || !createSessionResponse.data) {
                this.logger.error(`Cannot create session for ${email_or_username}`);
                return createSessionResponse;
            }
            this.logger.log(`Session created for ${email_or_username}`);
            return {
                success: true,
                statusCode: 200,
                message: 'Login successful',
                data: {
                    session: createSessionResponse.data as SessionDoc,
                },
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

    private async getUserInfo(email_or_username: string): Promise<Response<UserDoc>> {
        // Check if user exists
        const user = await this.userModel.findOne({ 
            $or: [
                { email: email_or_username }, 
                { username: email_or_username }] 
            }
        );
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
            data: user as UserDoc,
        }
    }

    private async checkPassword(password: string, password_hashed: string): Promise<Response<DeviceFingerprintDoc>> {
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

    private async checkDeviceFingerprint(fingerprint_hashed: string): Promise<Response<DeviceFingerprintDoc>> {
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
            data: device_fingerprint as DeviceFingerprintDoc,
        };
    }

    private async createDeviceFingerprint(user_id: string, fingerprint_hashed: string): Promise<Response<DeviceFingerprintDoc>> {
        // Check if device fingerprint already exists
        let device_fingerprint = await this.deviceFingerprintModel.findOne({ 
            $and: [
                { user_id: user_id }, 
                { fingerprint_hashed: fingerprint_hashed }
            ] 
        });
        if (!device_fingerprint) {
            device_fingerprint = await this.deviceFingerprintModel.create(
                { 
                    user_id: user_id, 
                    fingerprint_hashed: fingerprint_hashed, 
                    is_trusted: false,
                }
            );
        }
        return {
            success: true,
            statusCode: 200,
            message: 'Device fingerprint created',
            data: device_fingerprint as DeviceFingerprintDoc,
        };
    }

    private async sendDeviceFingerprintEmailVerification(user_id: string, fingerprint_hashed: string): Promise<Response> {
        // Send device fingerprint email verification
        const device_fingerprint_email_verification = await this.deviceFingerprintModel.findOne({ 
            $and: [
                { user_id: user_id }, 
                { fingerprint_hashed: fingerprint_hashed }
            ] 
        });
        if (!device_fingerprint_email_verification) {
            return {
                success: false,
                statusCode: 400,
                message: 'Device fingerprint not found',
            };
        }
        // Get user email
        const user = await this.userModel.findById(device_fingerprint_email_verification.user_id);
        if (!user) {
            return {
                success: false,
                statusCode: 400, 
                message: 'User not found',
            };
        } 
        // Send email verification code to user
        const email_verification_code = uuidv4().slice(0, 6); // 6 random characters
        // Store email verification code with email in Redis
        const fingerprint_email_verification_code_key = `fingerprint-email-verification:${email_verification_code}`;
        const fingerprint_email_verification_code_value = {
            user_id: user_id,
            fingerprint_hashed: fingerprint_hashed,
        }
        await this.redisInfrastructure.set(
            fingerprint_email_verification_code_key,
            JSON.stringify(fingerprint_email_verification_code_value), 60 * 5
        ); // 5 minutes
        // Send email verification code to user
        const sendEmailVerificationCodeResponse = await this.deviceFingerprintEmailVerification(user.email, email_verification_code);
        return {
            success: true,
            statusCode: 200,
            message: 'Device fingerprint email verification sent',
        };
    }

    private async deviceFingerprintEmailVerification(email: string, email_verification_code: string) {
        
        // Send welcome email to user
        await this.emailService.emit('email_request', {
            type: 'fingerprint-verify',
            data: {
                email: email,
                otpCode: email_verification_code,
            }
        })
        // Return success response
        return { success: true, statusCode: 200, message: 'Device fingerprint email verification sent' };
    }

    private async validateDeviceFingerprintEmailVerification(email_verification_code: string): Promise<Response> {
        // Validate device fingerprint email verification
        const device_fingerprint_data = await this.redisInfrastructure.get(`fingerprint-email-verification:${email_verification_code}`);
        if (!device_fingerprint_data) {
            return {
                success: false,
                statusCode: 400,
                message: 'Invalid email verification code',
            };
        }
        // Find device fingerprint in database
        const user_id = new Types.ObjectId(device_fingerprint_data.user_id);
        let device_fingerprint = await this.deviceFingerprintModel.findOne({ 
            $and: [
                { user_id: user_id },
                { fingerprint_hashed: device_fingerprint_data.fingerprint_hashed }
            ]
        });
        if (!device_fingerprint) {
            return {
                success: false,
                statusCode: 400,
                message: 'Device fingerprint not found',
            };
        }
        // Update device fingerprint to trusted
        device_fingerprint.is_trusted = true;
        await device_fingerprint.save();
        // Delete email verification code from Redis
        await this.redisInfrastructure.del(`fingerprint-email-verification:${email_verification_code}`);
        return {
            success: true,
            statusCode: 200,
            message: 'Device fingerprint email verification verified',
            data: device_fingerprint,
        };
    }

    private async createSession(user_id: string, device_fingerprint_id: string): Promise<Response<SessionDoc>> {
        const create_session_response = await this.sessionService.createSession(user_id, device_fingerprint_id);
        if (!create_session_response.success || !create_session_response.data) {
            return create_session_response;
        }
        return {
            success: true,
            statusCode: 200,
            message: 'Session created',
            data: create_session_response.data as SessionDoc,
        }
    }
}
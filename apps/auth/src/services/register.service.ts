import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';

// Schemas Import
import { User } from '../schemas/user.schema';

// Infrastructure and Strategies Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PasswordUtils } from '../utils/password.utils';

@Injectable()
export class RegisterService {
    private readonly logger: Logger;
    constructor(
        private readonly configService: ConfigService, 
        private readonly redisInfrastructure: RedisInfrastructure,
        private readonly jwtStrategy: JwtStrategy,
        private readonly passwordUtils: PasswordUtils,
        @InjectModel(User.name) private userModel: Model<User>,
        @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
    ) {
        this.logger = new Logger(RegisterService.name);
    }

    // register/email-verification
    async emailVerificationRegister(register_info: {username: string, email: string, password: string}) {
        // Get register info from request
        const { username, email, password } = register_info;
        // Check if password is strong enough
        const password_verification_and_hashing_response = await this.passwordVerificationAndHashing(password);
        if (!password_verification_and_hashing_response.success) {
            return password_verification_and_hashing_response;
        }
        const password_hashed = password_verification_and_hashing_response.data?.password_hashed;
        if (!password_hashed) {
            return { success: false, statusCode: 400, message: 'Invalid password' };
        }
        // Check if register info is valid and store in Redis
        const register_info_response = await this.registerInfo({username: username, email: email, password_hashed: password_hashed});
        if (!register_info_response.success) {
            return register_info_response;
        }
        // Send email verification code to user
        const send_email_verification_response = await this.sendEmailVerification(email);
        // Return success response
        return send_email_verification_response;
    }

    private async registerInfo(register_info: {username: string, email: string, password_hashed: string}) {
        // Get register info from request
        const { username, email, password_hashed } = register_info;
        // Check if user email already exists
        const existing_email = await this.userModel.findOne({email: email});
        if (existing_email) {
            return { success: false, statusCode: 400, message: 'Email already exists' };
        }
        // Check if user username already exists
        const existing_username = await this.userModel.findOne({username: username});
        if (existing_username) {
            return { success: false, statusCode: 400, message: 'Username already exists' };
        }
        // Store register info in Redis
        const register_info_key = `register_info:${email}`;
        const register_info_value = {
            username: username,
            email: email,
            password_hashed: password_hashed,
        };
        // Store register info in Redis
        await this.redisInfrastructure.set(register_info_key, JSON.stringify(register_info_value), 60 * 60); // 1 hour
        // Return success response
        return { success: true, statusCode: 200, message: 'Register info is valid' };
    }

    private async sendEmailVerification(email: string) {
        const emailVerificationCode = uuidv4().slice(0, 6); // 6 random characters
        // Store email verification code with email in Redis
        const email_verification_code_key = `email_verification_code:${emailVerificationCode}`;
        const email_verification_code_value = {
            email: email,
            code: emailVerificationCode,
        };
        await this.redisInfrastructure.set(email_verification_code_key, JSON.stringify(email_verification_code_value), 60 * 5); // 5 minutes
        // Send email verification code to user
        await this.emailService.emit('email_request', {
            type: 'create-account',
            data: {
                email: email,
                otpCode: emailVerificationCode,
            }
        })
        // Return success response
        return { success: true, statusCode: 200, message: 'Email verification code is sent' };
    }

    private async passwordVerificationAndHashing(password: string) {
        // Check if password is strong enough
        const password_strength = this.passwordUtils.validatePasswordStrength(password);
        if (!password_strength.isValid) {
            return { success: false, statusCode: 400, message: password_strength.feedback.join(', ') };
        }
        // Hash password
        const password_hashed = await this.passwordUtils.hashPassword(password);
        // Return success response
        return { 
            success: true,
            statusCode: 200, message: 'Password is strong enough', 
            data: {
                password_hashed: password_hashed, 
            }
        };
    }

    // register/verify-email
    async verifyEmail(email_verification_code: string) {
        const check_email_verification_code_response = await this.checkEmailVerificationCode(email_verification_code);
        if (!check_email_verification_code_response.success) {
            return check_email_verification_code_response;
        }
        const email = check_email_verification_code_response.data.email;
        // Create user
        const create_user_response = await this.createUser(email);
        if (!create_user_response.success) {
            return create_user_response;
        }
        // Send welcome email to user
        const welcome_email_response = await this.welcomeEmail(email);
        if (!welcome_email_response.success) {
            this.logger.error(welcome_email_response.message);
        }
        // Return success response
        return { success: true, statusCode: 200, message: 'User is created' };
    }

    private async checkEmailVerificationCode(email_verification_code: string) {
        // Get email verification code from Redis
        const email_verification_code_key = `email_verification_code:${email_verification_code}`;
        const email_verification_code_value = await this.redisInfrastructure.get(email_verification_code_key);
        if (!email_verification_code_value) {
            return { success: false, statusCode: 400, message: 'Invalid email verification code' };
        }
        // Delete email verification code from Redis
        await this.redisInfrastructure.del(email_verification_code_key);
        // Return success response
        return { success: true, statusCode: 200, message: 'Email verification code is valid', data: email_verification_code_value };
    }

    private async createUser(email: string) {
        // Get user data from Redis
        const register_info_key = `register_info:${email}`;
        const register_info_value = await this.redisInfrastructure.get(register_info_key);
        if (!register_info_value) {
            return { success: false, statusCode: 400, message: 'Invalid register info' };
        }
        // Check if user already exists (by email or username)
        const existing_user = await this.userModel.findOne({$or: [{email: email}, {username: register_info_value.username}]});
        if (existing_user) {
            return { success: false, statusCode: 400, message: 'User already exists' };
        }
        // Delete register info from Redis
        await this.redisInfrastructure.del(register_info_key);
        // Create user
        const user = await this.userModel.create({
            username: register_info_value.username,
            email: register_info_value.email,
            password_hashed: register_info_value.password_hashed,
        });
        // Return success response
        return { success: true, statusCode: 200, message: 'User is created', data: user };
    }

    private async welcomeEmail(email: string) {
        // Send welcome email to user
        await this.emailService.emit('email_request', {
            type: 'welcome-message',
            data: {
                email: email,
            }
        })
        // Return success response
        return { success: true, statusCode: 200, message: 'Welcome email is sent' };
    }
}
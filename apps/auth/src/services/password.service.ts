import { Inject, Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from "@nestjs/microservices";

// Services
import { InfoService } from "./info.service";
// Interfaces
import { Response, UserDoc } from "../interfaces/response.interface";
// Utils
import { PasswordUtils } from "../utils/password.utils";
// Models
import { User } from "../schemas/user.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
// Infrastructures
import { RedisInfrastructure } from "../infrastructure/redis.infrastructure";



@Injectable()
export class PasswordService {
    constructor(
        private readonly passwordUtils: PasswordUtils,
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly infoService: InfoService,
        private readonly redisInfrastructure: RedisInfrastructure,
        @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
    ) {}

    // password/change
    async changePassword(user_id: string, old_password: string, new_password: string): Promise<Response> {
        // Check if old password is correct
        const getUserInfoResponse = await this.infoService.getUserInfoByUserId(user_id);
        if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
            return getUserInfoResponse;
        }
        // Check if old password is correct
        const check_password_response = await this.checkPassword(old_password, getUserInfoResponse.data.password_hashed);
        if (!check_password_response.success) {
            return check_password_response;
        }
        // Hash new password
        const password_verification_and_hashing_response = await this.passwordVerificationAndHashing(new_password);
        if (!password_verification_and_hashing_response.success || !password_verification_and_hashing_response.data) {
            return password_verification_and_hashing_response;
        }
        const new_password_hashed = password_verification_and_hashing_response.data.password_hashed;
        // Change password
        const password_change_response = await this.passwordChange(user_id, new_password_hashed);

        // Return success response
        return password_change_response;
    }

    // password/forgot/email-verification
    async emailVerificationChangePassword(user_id: string): Promise<Response> {
        // Get user info
        const getUserInfoResponse = await this.infoService.getUserInfoByUserId(user_id);
        if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
            return getUserInfoResponse;
        }
        // Create and store verification code
        const verification_code = uuidv4().slice(0, 6); // 6 random characters
        const verification_code_key = `change_password_verification_code:${verification_code}`;
        const verification_code_value = {
            email: getUserInfoResponse.data._id,
            verification_code: verification_code,
        };
        await this.redisInfrastructure.set(verification_code_key, JSON.stringify(verification_code_value));
        // Send verification code to user
        await this.emailService.emit('email_request', {
            type: 'forgot-password-verify',
            email: getUserInfoResponse.data.email,
            verification_code: verification_code,
        });
        return { success: true, statusCode: 200, message: 'Verification code sent' };
    }

    // password/forgot/verify-email
    async verifyEmailChangePassword(email_verification_code: string): Promise<Response<UserDoc>> {
        // Get verification code from Redis
        const verification_code_key = `change_password_verification_code:${email_verification_code}`;
        const verification_code_value = await this.redisInfrastructure.get(verification_code_key);
        if (!verification_code_value) {
            return { success: false, statusCode: 400, message: 'Invalid verification code' };
        }
        // Get user info
        const getUserInfoResponse = await this.infoService.getUserInfoByUserId(verification_code_value.user_id);
        if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
            return getUserInfoResponse;
        }
        // Return success response
        return { success: true, statusCode: 200, message: 'Verification code is valid', data: getUserInfoResponse.data };
    }

    // password/forgot/change
    async changeForgotPassword(user_id: string, email_verification_code: string, new_password: string): Promise<Response> {
        // Verify email verification code
        const verify_email_change_password_response = await this.verifyEmailChangePassword(email_verification_code);
        if (!verify_email_change_password_response.success || !verify_email_change_password_response.data) {
            return verify_email_change_password_response;
        }
        // Delete verification code from Redis
        const verification_code_key = `change_password_verification_code:${email_verification_code}`;
        await this.redisInfrastructure.del(verification_code_key);
        // Hash new password
        const password_verification_and_hashing_response = await this.passwordVerificationAndHashing(new_password);
        if (!password_verification_and_hashing_response.success || !password_verification_and_hashing_response.data) {
            return password_verification_and_hashing_response;
        }
        const new_password_hashed = password_verification_and_hashing_response.data.password_hashed;
        // Change password
        const password_change_response = await this.passwordChange(user_id, new_password_hashed);
        // Return success response
        return password_change_response;
    }

    async checkPassword(password: string, password_hashed: string): Promise<Response> {
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

    async passwordVerificationAndHashing(password: string): Promise<Response<{password_hashed: string}>> {
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

    private async passwordChange(user_id: string, new_password_hashed: string): Promise<Response> {
        // Change password
        const update_password_response = await this.userModel.findByIdAndUpdate(user_id, { password_hashed: new_password_hashed });
        if (!update_password_response) {
            return { success: false, statusCode: 400, message: 'Failed to change password' };
        }
        return { success: true, statusCode: 200, message: 'Password changed successfully' };
    }

}
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Schemas Import
import { User } from '../schemas/user.schema';

// Infrastructure Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';

@Injectable()
export class RegisterService {
    constructor(
        private readonly configService: ConfigService, 
        private readonly redisInfrastructure: RedisInfrastructure,
    ) {}

    async emailVerificationRegister(register_info: {username: string, email: string, password: string}) {
        const { username, email, password } = register_info;
        const register_info_response = await this.registerInfo({username: username, email: email, password: password});
        if (!register_info_response.success) {
            return register_info_response;
        }
        const send_email_verification_response = await this.sendEmailVerification(email);
        return send_email_verification_response;
    }

    async registerInfo(register_info: {username: string, email: string, password: string}) {
        const { username, email, password } = register_info;
        // Check if user email already exists
        const existing_email = await User.findOne({email: email});
        if (existing_email) {
            return { success: false, code: 400, message: 'Email already exists' };
        }
        // Check if user username already exists
        const existing_username = await User.findOne({username: username});
        if (existing_username) {
            return { success: false, code: 400, message: 'Username already exists' };
        }
        // Store register info in Redis
        const register_info_key = `register_info:${email}`;
        const register_info_value = {
            username: username,
            email: email,
            password: password
        };
        await this.redisInfrastructure.set(register_info_key, JSON.stringify(register_info_value), 60 * 60); // 1 hour
        return { success: true, code: 200, message: 'Register info is valid' };
    }

    async sendEmailVerification(email: string) {
        
    }
}
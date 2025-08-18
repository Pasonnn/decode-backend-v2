import { Injectable } from "@nestjs/common";

// Interfaces
import { UserDoc } from "../interfaces/login.interface";
import { Response } from "../interfaces/response.interface";

// Models
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../schemas/user.schema";

// Jwt Strategy
import { JwtStrategy } from "../strategies/jwt.strategy";

@Injectable()
export class InfoService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly jwtStrategy: JwtStrategy,
    ) {}

     async getUserInfoByEmailOrUsername(email_or_username: string): Promise<Response<UserDoc>> {
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

    async getUserInfoByAccessToken(access_token: string): Promise<Response<UserDoc>> {
        // Validate access token
        const user_id = await this.jwtStrategy.validateAccessToken(access_token);
        if (!user_id) {
            return {
                success: false,
                statusCode: 400,
                message: 'Invalid access token',
            }
        }
        // Get user info
        const user = await this.userModel.findById(user_id);
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

    async getUserInfoByUserId(user_id: string): Promise<Response<UserDoc>> {
        // Check if user exists
        const user = await this.userModel.findById(user_id);
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
}
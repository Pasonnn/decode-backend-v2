// Modules Import
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

// Schemas Import
import { Session } from "../schemas/session.schema";

// Interfaces Import
import { SessionDoc } from "../interfaces/session.interface";

// Strategies Import
import { JwtStrategy } from "../strategies/jwt.strategy";
import { Response } from "../interfaces/response.interface";


export class SessionService {
    constructor(
        private readonly jwtStrategy: JwtStrategy,
        @InjectModel(Session.name) private sessionModel: Model<Session>,
    ) {}

    async createSession(user_id: string, device_fingerprint_id: string): Promise<Response<SessionDoc>> {
        // Generate session token
        const session_token = await this.jwtStrategy.createRefreshToken(user_id);
        // Create session
        const session = await this.sessionModel.create({
            user_id: user_id,
            device_fingerprint_id: device_fingerprint_id,
            token: session_token,
        });
        return {
            success: true,
            statusCode: 200,
            message: 'Session created',
            data: session as unknown as SessionDoc,
        };
    }
}
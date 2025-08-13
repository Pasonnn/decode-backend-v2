/**
 * Authentication Controller
 * 
 * This controller handles all authentication related requests.
 * It receives messages from the API gateway and delegate to the services,
 * 
 * Message Pattern:
 * - auth/healthz: Health check endpoint
 * - auth/register/info: User registration info (username, email, password)
 * - auth/register/send-email-verification: Send email verification code to email
 * - auth/register/verify-email: Verify email by code
 * - auth/register/create-user: Create user in database
 * - auth/login/info: User login info (username_or_email, password)
 * - auth/login/fingerprint-check: Fingerprint check (if not valid, create untrusted fingerprint
 * in Redis with key: `fingerprint:${user_id}:${fingerprint_hash}`)
 * - auth/login/fingerprint-send-email-verify: Send email verification code to email (email)
 * - auth/login/fingerprint-email-code-verify: Verify email by code (email, code)
 * - auth/login/fingerprint-create: Create trusted fingerprint (user_id, fingerprint_hash)
 * - auth/session/create: Create session (user_id, fingerprint_id)
 * - auth/session/refresh: Refresh session (session id)
 * - auth/session/by-sso: Get session token by sso code (sso code)
 * - auth/session/logout: Logout session (session id)
 * - auth/password/change/info: Change password info (user_id, old_password, new_password)
 * - auth/password/change/change-password: Change password (user_id, new_password)
 * - auth/password/forgot/info: Forgot password info (username_or_email)
 * - auth/password/forgot/send-email-verify: Send email verification code to email (email)
 * - auth/password/forgot/email-code-verify: Verify email by code (email, code)
 * - auth/password/forgot/change-password: Change password (user_id, new_password)
 * - auth/info/by-access-token: Get user info by access token (access_token)
*/

// Import the necessary modules
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RegisterInfoDto, VerifyEmailDto } from './dto/register.dto';
import { Response } from './interfaces/response.interface';

// Import the Services
import { RegisterService } from './services/register.service';
// import { LoginService } from '../services/login.service';
// import { SessionService } from '../services/session.service';
// import { PasswordService } from '../services/password.service';
// import { InfoService } from '../services/info.service';

// Auth Controller Class
@Controller('auth')
export class AuthController {
    constructor(
        private readonly registerService: RegisterService,
    ) {}

    // Health Check Endpoint
    @Get('healthz')
    checkHealth(): {status: string} {
        return {status: 'ok'};
    }

    // Register Controller
    @Post('register/email-verification')
    async emailVerificationRegister(@Body() dto: RegisterInfoDto): Promise<Response> {
        const email_verification_register_response = await this.registerService.emailVerificationRegister(dto);
        return {
            success: email_verification_register_response.success,
            statusCode: email_verification_register_response.code, 
            message: email_verification_register_response.message,
        };    
    }

    @Post('register/verify-email')
    async verifyEmailRegister(@Body() dto: VerifyEmailDto): Promise<Response> {
        const verify_email_register_response = await this.registerService.verifyEmail(dto.code);
        return {
            success: verify_email_register_response.success,
            statusCode: verify_email_register_response.code, 
            message: verify_email_register_response.message,
        };
    }

    // // Login Controller
    // @MessagePattern('fingerprint-login')
    // async fingerprintLogin(dto: FingerprintLoginDto): Promise<FingerprintLoginResponse> {
    //     const login_info_response = await this.loginController.loginInfo({username_or_email: dto.username_or_email, password: dto.password});
    //     if (!login_info_response.success) {
    //         return login_info_response;
    //     }
    //     const fingerprint_check_response = await this.loginController.fingerprintCheck(dto.fingerprint_hash);
    //     if (!fingerprint_check_response.success) {
    //         const fingerprint_send_email_verify_response = await this.loginController.fingerprintSendEmailVerify(dto.email);
    //         if (!fingerprint_send_email_verify_response.success) {
    //             return {
    //                 success: false,
    //                 code: 400,
    //                 message: 'Failed to send email verification code'
    //             };
    //         }
    //         return {
    //             success: false,
    //             code: 400,
    //             message: 'Please verify your device fingerprint'
    //         };
    //     } else { // The fingerprint is valid
    //         const session_create_response = await this.sessionController.sessionCreate({user_id: login_info_response.user_id, fingerprint_id: fingerprint_check_response.fingerprint_id});
    //         if (!session_create_response.success) {
    //             return session_create_response;
    //         }
    //         const session_refresh_response = await this.sessionController.sessionRefresh({session_token: session_create_response.session.token});
    //         if (!session_refresh_response.success) {
    //             return session_refresh_response;
    //         }
    //         return {success: true,
    //             code: 200,
    //             message: 'Login successful',
    //             data: {
    //                 session_token: session_create_response.data.session.token,
    //                 access_token: session_refresh_response.data.access_token
    //             }};
    //     }
    // }
}

// export class RegisterController {
//     constructor(private readonly registerService: RegisterService) {}
//     /*
//     * User Register
//     * Work flow:
//     * STEP 1:
//     * 1. register/info: 
//     * input: username, email, password
//     * process: store user data to Redis with key: `register:${email} - value: ${username} - ${hashed_password}`
//     * output: success or error
//     * 2. register/send-email-verification:
//     * input: email
//     * process: send email verification code to email, store to Redis with key: `email-verification:${email}`
//     * output: success or error
//     * STEP 2:
//     * 3. register/verify-email:
//     * input: email, code
//     * process: check if code is valid
//     * output: success or error
//     * 4. register/create-user:
//     * input: email
//     * process: get user data from Redis with key: `register:${email}`
//     * and create user in database
//     * output: success or error
//     */
//     // User Register Endpoint
//     registerInfo(dto: RegisterInfoDto): Promise<Response> {
//         return this.registerService.registerInfo(dto);
//     }

//     // User Register Send Email Verification Endpoint
//     sendEmailVerification(email: string): Promise<Response> {
//         return this.registerService.sendEmailVerification(email);
//     }

//     // User Register Verify Email Endpoint
//     verifyEmail(dto: VerifyEmailDto): Promise<Response> {
//         return this.registerService.verifyEmail(dto);
//     }

//     // User Register Create User Endpoint
//     createUser(email: string): Promise<Response> {
//         return this.registerService.createUser(email);
//     }
// }

// export class LoginController {
//     constructor(private readonly loginService: LoginService) {}
//     /*
//     * User Login
//     * Work flow:
//     * A. Fingerprint Trusted
//     * STEP 1:
//     * 1. login/info:
//     * input: username_or_email, password
//     * process: check if user exist and password is correct
//     * output: success (return user_id) or error
//     * 2. login/fingerprint-check:
//     * input: fingerprint_hash (device data)
//     * process: check if fingerprint is trusted/in database (in case A, fingerprint is trusted)
//     * output: success (return fingerprint_id)
//     * 3. session/create:
//     * input: user_id, fingerprint_id
//     * process: create session
//     * output: success (return session_data - including session.token) or error
//     * 4. session/refresh:
//     * input: session_token
//     * process: refresh session
//     * output: success (return access_token) or error

//     * B. Fingerprint Not Trusted
//     * STEP 1:
//     * 1. login/info:
//     * input: username_or_email, password
//     * process: check if user exist and password is correct
//     * output: success (return user_id) or error
//     * 2. login/fingerprint-check:
//     * input: fingerprint_hash (device data)
//     * process: check if fingerprint is trusted/in database (in case B, fingerprint is not trusted)
//     * store fingerprint hash to Redis with key: `fingerprint:${user_id} - value: ${fingerprint_hash}`
//     * output: error
//     * 3. login/fingerprint-send-email-verify:
//     * input: email
//     * process: create code and store it to Redis with key: `fingerprint-email-verification:${code} - value: ${user_id}`
//     * send email verification code to email
//     * output: success or error
//     * STEP 2:
//     * 4. login/fingerprint-email-code-verify:
//     * input: email, code
//     * process: check if code is valid
//     * if valid take the user_id from redis with key: `fingerprint-email-verification:${code}`
//     * and from user_id take the fingerprint_hash from Redis with key: `fingerprint:${user_id}`
//     * output: success (return fingerprint hash) or error
//     * 5. login/fingerprint-create:
//     * input: user_id, fingerprint_hash
//     * process: create trusted fingerprint in database with trusted: true
//     * output: success (return session token) or error
//     * 6. session/create:
//     * input: user_id, fingerprint_id
//     * process: create session
//     * output: success (return session token) or error
//     * 7. session/refresh:
//     * input: session_id
//     * process: refresh session
//     * output: success (return access_token) or error
//     */
//     // User Login Endpoint
//     loginInfo(dto: LoginInfoDto): Promise<LoginInfoResponse> {
//         return this.authService.loginInfo(dto);
//     }

//     // User Login Fingerprint Check Endpoint
//     fingerprintCheck(fingerprint_hash: string): Promise<FingerprintCheckResponse> {
//         return this.authService.fingerprintCheck(fingerprint_hash);
//     }

//     // User Login Fingerprint Send Email Verify Endpoint
//     fingerprintSendEmailVerify(email: string): Promise<FingerprintSendEmailVerifyResponse> {
//         return this.authService.fingerprintSendEmailVerify(email);
//     }

//     // User Login Fingerprint Email Code Verify Endpoint
//     fingerprintEmailCodeVerify(dto: FingerprintEmailCodeVerifyDto): Promise<FingerprintEmailCodeVerifyResponse> {
//         return this.authService.fingerprintEmailCodeVerify(dto);
//     }

//     // User Login Fingerprint Create Endpoint
//     fingerprintCreate(dto: FingerprintCreateDto): Promise<FingerprintCreateResponse> {
//         return this.authService.fingerprintCreate(dto);
//     }
// }

// export class SessionController {
//     constructor(private readonly sessionService: SessionService) {}

//     /*
//     * User Session
//     * List of endpoints:
//     * 1. session/create:
//     * input: user_id, fingerprint_id
//     * process: create session
//     * output: success (return session token) or error
//     * 2. session/refresh:
//     * input: session_id
//     * process: refresh session
//     * output: success (return access_token) or error
//     * 3. session/by-sso:
//     * input: sso_code
//     * process: get session token by sso code
//     * output: success (return session token) or error
//     * 4. session/logout:
//     * input: session_id
//     * process: logout session
//     * output: success or error
//     */
//     // User Session Create Endpoint
//     sessionCreate(dto: SessionCreateDto): Promise<SessionCreateResponse> {
//         return this.sessionService.sessionCreate(dto);
//     }

//     // User Session Refresh Endpoint
//     sessionRefresh(dto: SessionRefreshDto): Promise<SessionRefreshResponse> {
//         return this.sessionService.sessionRefresh(dto);
//     }

//     // User Session By SSO Endpoint
//     sessionBySso(dto: SessionBySsoDto): Promise<SessionBySsoResponse> {
//         return this.sessionService.sessionBySso(dto);
//     }

//     // User Session Logout Endpoint
//     sessionLogout(dto: SessionLogoutDto): Promise<SessionLogoutResponse> {
//         return this.sessionService.sessionLogout(dto);
//     }
// }

// export class PasswordController {
//     constructor(private readonly passwordService: PasswordService) {}
//     /*
//     * User Password
//     * A. Password Change
//     * 1. password/change/info:
//     * input: user_id, old_password, new_password
//     * process: check if old password is correct
//     * output: success (return user_data) or error
//     * 2. password/change/change-password:
//     * input: user_id, new_password
//     * process: change password
//     * output: success or error
//     * B. Password Forgot
//     * 1. password/forgot/info:
//     * input: username_or_email
//     * process: check if user exist and password is correct
//     * output: success (return user_data) or error
//     * 2. password/forgot/send-email-verify:
//     * input: email
//     * process: create code and store it to Redis with key: `password-forgot:${code} - value: ${user_id}`
//     * send email verification code to email
//     * output: success or error
//     * 3. password/forgot/email-code-verify:
//     * input: code
//     * process: check if code is valid
//     * if valid take the user_id from redis with key: `password-forgot:${code}`
//     * and create a password key in Redis with key: `password_key:${user_id} - value: ${password_key}`
//     * output: success (return password_key) or error
//     * 4. password/forgot/change-password:
//     * input: password_key, new_password
//     * process: take the user_id from redis with key: `password_key:${password_key}`
//     * and change password in database
//     * output: success or error
//     */
//     // User Password Change Info Endpoint
//     passwordChangeInfo(dto: PasswordChangeInfoDto): Promise<PasswordChangeInfoResponse> {
//         return this.passwordService.passwordChangeInfo(dto);
//     }

//     // User Password Change Change Password Endpoint
//     passwordChangeChangePassword(dto: PasswordChangeChangePasswordDto): Promise<PasswordChangeChangePasswordResponse> {
//         return this.passwordService.passwordChangeChangePassword(dto);
//     }

//     // User Password Forgot Info Endpoint
//     passwordForgotInfo(dto: PasswordForgotInfoDto): Promise<PasswordForgotInfoResponse> {
//         return this.passwordService.passwordForgotInfo(dto);
//     }

//     // User Password Forgot Send Email Verify Endpoint
//     passwordForgotSendEmailVerify(email: string): Promise<PasswordForgotSendEmailVerifyResponse> {
//         return this.passwordService.passwordForgotSendEmailVerify(email);
//     }

//     // User Password Forgot Email Code Verify Endpoint
//     passwordForgotEmailCodeVerify(dto: PasswordForgotEmailCodeVerifyDto): Promise<PasswordForgotEmailCodeVerifyResponse> {
//         return this.passwordService.passwordForgotEmailCodeVerify(dto);
//     }

//     // User Password Forgot Change Password Endpoint
//     passwordForgotChangePassword(dto: PasswordForgotChangePasswordDto): Promise<PasswordForgotChangePasswordResponse> {
//         return this.passwordService.passwordForgotChangePassword(dto);
//     }
// }

// export class InfoController {
//     constructor(private readonly infoService: InfoService) {}

//     /* 
//     * User Info by Access Token
//     * 1. info/by-access-token:
//     * input: access_token
//     * process: get user info by access token
//     * output: success (return user_data) or error
//     */
//     // User Info by Access Token Endpoint
//     infoByAccessToken(access_token: string): Promise<InfoByAccessTokenResponse> {
//         return this.infoService.infoByAccessToken(access_token);
//     }
// }

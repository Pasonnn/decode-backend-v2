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
 */

// Import the necessary modules


// Auth Controller Class
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // Health Check Endpoint
    @MessagePattern('healthz')
    checkHealth(): {status: string} {
        return {status: 'ok'};
    }

    /*
    * User Register
    * Work flow:
    * 1. register/info: 
    * input: username, email, password
    * process: store user data to Redis with key: `register:${email}`
    * output: success or error
    * 2. register/send-email-verification:
    * input: email
    * process: send email verification code to email, store to Redis with key: `email-verification:${email}`
    * output: success or error
    * 3. register/verify-email:
    * input: email, code
    * process: check if code is valid
    * output: success or error
    * 4. register/create-user:
    * input: username, email, password
    * process: create user in database
    * output: success or error
    */
    // User Register Endpoint
    @MessagePattern('register/info')
    registerInfo(dto: RegisterInfoDto): Promise<registerInfoResponseDto> {
        return this.authService.registerInfo(dto);
    }

    // User Register Send Email Verification Endpoint
    @MessagePattern('register/send-email-verification')
    sendEmailVerification(email: string): Promise<sendEmailVerificationResponseDto> {
        return this.authService.sendEmailVerification(email);
    }

    // User Register Verify Email Endpoint
    @MessagePattern('register/verify-email')
    verifyEmail(dto: VerifyEmailDto): Promise<verifyEmailResponseDto> {
        return this.authService.verifyEmail(dto);
    }

    // User Register Create User Endpoint
    @MessagePattern('register/create-user')
    createUser(dto: CreateUserDto): Promise<createUserResponseDto> {
        return this.authService.createUser(dto);
    }

    /*
    * User Login
    * Work flow:
    * A. Fingerprint Trusted
    * 1. login/info:
    * input: username_or_email, password
    * process: check if user exist and password is correct
    * output: success (return user_id) or error
    * 2. login/fingerprint-check:
    * input: fingerprint_hash (device data)
    * process: check if fingerprint is trusted/in database (in case A, fingerprint is trusted)
    * output: success (return fingerprint_id)
    * 3. session/create:
    * input: user_id, fingerprint_id
    * process: create session
    * output: success (return session_id) or error
    * 4. session/refresh:
    * input: session_id
    * process: refresh session
    * output: success (return access_token) or error

    * B. Fingerprint Not Trusted
    * 1. login/info:
    * input: username_or_email, password
    * process: check if user exist and password is correct
    * output: success (return user_id) or error
    * 2. login/fingerprint-check:
    * input: fingerprint_hash (device data)
    * process: check if fingerprint is trusted/in database (in case B, fingerprint is not trusted)
    * store fingerprint hash to Redis with key: `fingerprint:${user_id} - value: ${fingerprint_hash}`
    * output: error
    * 3. login/fingerprint-send-email-verify:
    * input: email
    * process: create code and store it to Redis with key: `fingerprint-email-verification:${code} - value: ${user_id}`
    * send email verification code to email
    * output: success or error
    * 4. login/fingerprint-email-code-verify:
    * input: email, code
    * process: check if code is valid
    * if valid take the user_id from redis with key: `fingerprint-email-verification:${code}`
    * and from user_id take the fingerprint_hash from Redis with key: `fingerprint:${user_id}`
    * output: success (return fingerprint hash) or error
    * 5. login/fingerprint-create:
    * input: user_id, fingerprint_hash
    * process: create trusted fingerprint in database
    * output: success (return session token) or error
    * 6. session/create:
    * input: user_id, fingerprint_id
    * process: create session
    * output: success (return session token) or error
    * 7. session/refresh:
    * input: session_id
    * process: refresh session
    * output: success (return access_token) or error
    */
    // User Login Endpoint
    @MessagePattern('login/info')
    loginInfo(dto: LoginInfoDto): Promise<loginInfoResponseDto> {
        return this.authService.loginInfo(dto);
    }

    // User Login Fingerprint Check Endpoint
    @MessagePattern('login/fingerprint-check')
    fingerprintCheck(fingerprint_hash: string): Promise<fingerprintCheckResponseDto> {
        return this.authService.fingerprintCheck(fingerprint_hash);
    }

    @MessagePattern('login/fingerprint-send-email-verify')
    fingerprintSendEmailVerify(email: string): Promise<fingerprintSendEmailVerifyResponseDto> {
        return this.authService.fingerprintSendEmailVerify(email);
    }

    @MessagePattern('login/fingerprint-email-code-verify')
    fingerprintEmailCodeVerify(dto: FingerprintEmailCodeVerifyDto): Promise<fingerprintEmailCodeVerifyResponseDto> {
        return this.authService.fingerprintEmailCodeVerify(dto);
    }

    // User Login Fingerprint Create Endpoint
    @MessagePattern('login/fingerprint-create')
    fingerprintCreate(dto: FingerprintCreateDto): Promise<fingerprintCreateResponseDto> {
        return this.authService.fingerprintCreate(dto);
    }
    
    /*
    * User Session
    * List of endpoints:
    * 1. session/create:
    * input: user_id, fingerprint_id
    * process: create session
    * output: success (return session token) or error
    * 2. session/refresh:
    * input: session_id
    * process: refresh session
    * output: success (return access_token) or error
    * 3. session/by-sso:
    * input: sso_code
    * process: get session token by sso code
    * output: success (return session token) or error
    * 4. session/logout:
    * input: session_id
    * process: logout session
    * output: success or error
    */
    // User Session Create Endpoint
    @MessagePattern('session/create')
    sessionCreate(dto: SessionCreateDto): Promise<sessionCreateResponseDto> {
        return this.authService.sessionCreate(dto);
    }

    // User Session Refresh Endpoint
    @MessagePattern('session/refresh')
    sessionRefresh(dto: SessionRefreshDto): Promise<sessionRefreshResponseDto> {
        return this.authService.sessionRefresh(dto);
    }

    // User Session By SSO Endpoint
    @MessagePattern('session/by-sso')
    sessionBySso(dto: SessionBySsoDto): Promise<sessionBySsoResponseDto> {
        return this.authService.sessionBySso(dto);
    }

    // User Session Logout Endpoint
    @MessagePattern('session/logout')
    sessionLogout(dto: SessionLogoutDto): Promise<sessionLogoutResponseDto> {
        return this.authService.sessionLogout(dto);
    }

    /*
    * User Password
    * A. Password Change
    * 1. password/change/info:
    * input: user_id, old_password, new_password
    * process: check if old password is correct
    * output: success (return user_data) or error
    * 2. password/change/change-password:
    * input: user_id, new_password
    * process: change password
    * output: success or error
    * B. Password Forgot
    * 1. password/forgot/info:
    * input: username_or_email
    * process: check if user exist and password is correct
    * output: success (return user_data) or error
    * 2. password/forgot/send-email-verify:
    * input: email
    * process: create code and store it to Redis with key: `password-forgot:${code} - value: ${user_id}`
    * send email verification code to email
    * output: success or error
    * 3. password/forgot/email-code-verify:
    * input: code
    * process: check if code is valid
    * if valid take the user_id from redis with key: `password-forgot:${code}`
    * and create a password key in Redis with key: `password_key:${user_id} - value: ${password_key}`
    * output: success (return password_key) or error
    * 4. password/forgot/change-password:
    * input: password_key, new_password
    * process: take the user_id from redis with key: `password_key:${password_key}`
    * and change password in database
    * output: success or error
    */
    // User Password Change Info Endpoint
    @MessagePattern('password/change/info')
    passwordChangeInfo(dto: PasswordChangeInfoDto): Promise<passwordChangeInfoResponseDto> {
        return this.authService.passwordChangeInfo(dto);
    }

    // User Password Change Change Password Endpoint
    @MessagePattern('password/change/change-password')
    passwordChangeChangePassword(dto: PasswordChangeChangePasswordDto): Promise<passwordChangeChangePasswordResponseDto> {
        return this.authService.passwordChangeChangePassword(dto);
    }

    // User Password Forgot Info Endpoint
    @MessagePattern('password/forgot/info')
    passwordForgotInfo(dto: PasswordForgotInfoDto): Promise<passwordForgotInfoResponseDto> {
        return this.authService.passwordForgotInfo(dto);
    }

    // User Password Forgot Send Email Verify Endpoint
    @MessagePattern('password/forgot/send-email-verify')
    passwordForgotSendEmailVerify(email: string): Promise<passwordForgotSendEmailVerifyResponseDto> {
        return this.authService.passwordForgotSendEmailVerify(email);
    }

    // User Password Forgot Email Code Verify Endpoint
    @MessagePattern('password/forgot/email-code-verify')
    passwordForgotEmailCodeVerify(dto: PasswordForgotEmailCodeVerifyDto): Promise<passwordForgotEmailCodeVerifyResponseDto> {
        return this.authService.passwordForgotEmailCodeVerify(dto);
    }

    // User Password Forgot Change Password Endpoint
    @MessagePattern('password/forgot/change-password')
    passwordForgotChangePassword(dto: PasswordForgotChangePasswordDto): Promise<passwordForgotChangePasswordResponseDto> {
        return this.authService.passwordForgotChangePassword(dto);
    }

    /* 
    * User Info by Access Token
    * 1. info/by-access-token:
    * input: access_token
    * process: get user info by access token
    * output: success (return user_data) or error
    */
    // User Info by Access Token Endpoint
    @MessagePattern('info/by-access-token')
    infoByAccessToken(access_token: string): Promise<infoByAccessTokenResponseDto> {
        return this.authService.infoByAccessToken(access_token);
    }
}
export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
  }
  
  export class EmailTemplates {
    static createAccount(email: string, otpCode: string): EmailTemplate {
      return {
        subject: 'Verify Your Email - Create Your Decode Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">Welcome to Decode!</h2>
              <p>Hi there,</p>
              <p>You're creating a new account with Decode. To complete your registration, please use the verification code below:</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #3498db; font-size: 32px; margin: 0; letter-spacing: 4px;">${otpCode}</h1>
              </div>
              
              <p><strong>This code will expire in 5 minutes.</strong></p>
              
              <p>If you didn't request this code, please ignore this email.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                This email was sent to ${email}. If you have any questions, please contact our support team.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
  Welcome to Decode!
  
  Hi there,
  
  You're creating a new account with Decode. To complete your registration, please use the verification code below:
  
  ${otpCode}
  
  This code will expire in 5 minutes.
  
  If you didn't request this code, please ignore this email.
  
  ---
  This email was sent to ${email}. If you have any questions, please contact our support team.
        `
      };
    }
  
    static welcomeMessage(email: string): EmailTemplate {
      return {
        subject: 'Welcome to Decode! Your Account is Ready',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to Decode</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">🎉 Welcome to Decode!</h2>
              <p>Hi there,</p>
              <p>Congratulations! Your Decode account has been successfully created and verified.</p>
              
              <p>You can now:</p>
              <ul>
                <li>Access all Decode features</li>
                <li>Connect with other users</li>
                <li>Explore our platform</li>
              </ul>
              
              <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #27ae60;"><strong>Your account is now active and ready to use!</strong></p>
              </div>
              
              <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
              
              <p>Happy coding!</p>
              <p>The Decode Team</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                This email was sent to ${email}. If you have any questions, please contact our support team.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
  🎉 Welcome to Decode!
  
  Hi there,
  
  Congratulations! Your Decode account has been successfully created and verified.
  
  You can now:
  - Access all Decode features
  - Connect with other users
  - Explore our platform
  
  Your account is now active and ready to use!
  
  If you have any questions or need assistance, don't hesitate to reach out to our support team.
  
  Happy coding!
  The Decode Team
  
  ---
  This email was sent to ${email}. If you have any questions, please contact our support team.
        `
      };
    }
  
    static fingerprintVerify(email: string, otpCode: string): EmailTemplate {
      return {
        subject: 'New Device Login - Verify Your Identity',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>New Device Login</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #e74c3c;">🔒 New Device Login Detected</h2>
              <p>Hi there,</p>
              <p>We detected a login attempt from a new device for your Decode account.</p>
              
              <p>If this was you, please use the verification code below to complete the login:</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #3498db; font-size: 32px; margin: 0; letter-spacing: 4px;">${otpCode}</h1>
              </div>
              
              <p><strong>This code will expire in 5 minutes.</strong></p>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ If this wasn't you:</strong><br>
                  Someone may have access to your account. Please 
                  <a href="https://decode.com/change-password" style="color: #e74c3c;">change your password immediately</a>.
                </p>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                This email was sent to ${email}. If you have any questions, please contact our support team.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
  🔒 New Device Login Detected
  
  Hi there,
  
  We detected a login attempt from a new device for your Decode account.
  
  If this was you, please use the verification code below to complete the login:
  
  ${otpCode}
  
  This code will expire in 5 minutes.
  
  ⚠️ If this wasn't you:
  Someone may have access to your account. Please change your password immediately at: https://decode.com/change-password
  
  ---
  This email was sent to ${email}. If you have any questions, please contact our support team.
        `
      };
    }
  
    static forgotPasswordVerify(email: string, otpCode: string): EmailTemplate {
      return {
        subject: 'Password Reset Request - Verify Your Identity',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #e74c3c;">🔑 Password Reset Request</h2>
              <p>Hi there,</p>
              <p>We received a request to reset the password for your Decode account.</p>
              
              <p>To proceed with the password reset, please use the verification code below:</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #3498db; font-size: 32px; margin: 0; letter-spacing: 4px;">${otpCode}</h1>
              </div>
              
              <p><strong>This code will expire in 5 minutes.</strong></p>
              
              <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                <p style="margin: 0; color: #0c5460;">
                  <strong>💡 Tip:</strong> If you remember your password, you can safely ignore this email.
                </p>
              </div>
              
              <p>If you didn't request a password reset, please ignore this email or contact our support team immediately.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                This email was sent to ${email}. If you have any questions, please contact our support team.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
  🔑 Password Reset Request
  
  Hi there,
  
  We received a request to reset the password for your Decode account.
  
  To proceed with the password reset, please use the verification code below:
  
  ${otpCode}
  
  This code will expire in 5 minutes.
  
  💡 Tip: If you remember your password, you can safely ignore this email.
  
  If you didn't request a password reset, please ignore this email or contact our support team immediately.
  
  ---
  This email was sent to ${email}. If you have any questions, please contact our support team.
        `
      };
    }
  }
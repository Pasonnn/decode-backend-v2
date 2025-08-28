import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import authConfig from '../config/auth.config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PasswordUtils {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password to hash
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = authConfig().password.saltRounds;
    const hashedPassword = await (bcrypt as any).hash(password, saltRounds) as string;
    return hashedPassword;
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password to compare against
   * @returns True if passwords match, false otherwise
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await (bcrypt as any).compare(password, hashedPassword) as boolean;
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Validation result with details
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number; // 0-4 (0=very weak, 4=very strong)
    feedback: string[];
    requirements: {
      minLength: boolean;
      hasUppercase: boolean;
      hasLowercase: boolean;
      hasNumbers: boolean;
      hasSpecialChars: boolean;
    };
  } {
    const requirements = {
      minLength: password.length >= authConfig().password.minLength,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    const feedback: string[] = [];
    let score = 0;

    // Check minimum length
    if (!requirements.minLength) {
      feedback.push(
        `Password must be at least ${authConfig().password.minLength} characters long`,
      );
    } else {
      score += 1;
    }

    // Check for uppercase letters
    if (!requirements.hasUppercase) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Check for lowercase letters
    if (!requirements.hasLowercase) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Check for numbers
    if (!requirements.hasNumbers) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Check for special characters
    if (!requirements.hasSpecialChars) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Additional strength checks
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Password should not contain repeated characters');
      score = Math.max(0, score - 1);
    }

    // Check for common patterns
    const commonPatterns = [
      '123456',
      'password',
      'qwerty',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'football',
    ];

    const lowerPassword = password.toLowerCase();
    if (commonPatterns.some((pattern) => lowerPassword.includes(pattern))) {
      feedback.push('Password should not contain common words or patterns');
      score = Math.max(0, score - 2);
    }

    const isValid =
      Object.values(requirements).every((req) => req) && score >= 3;

    return {
      isValid,
      score: Math.min(4, score),
      feedback,
      requirements,
    };
  }

  /**
   * Generate a secure random password
   * @param length - Length of the password (default: 16)
   * @param options - Password generation options
   * @returns Generated password
   */
  generateSecurePassword(
    length: number = 16,
    options: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSpecialChars?: boolean;
      excludeSimilar?: boolean;
    } = {},
  ): string {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecialChars = true,
      excludeSimilar = true,
    } = options;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSpecialChars) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Remove similar characters if requested
    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Generate a temporary password for password reset
   * @returns Temporary password
   */
  generateTemporaryPassword(): string {
    return this.generateSecurePassword(12, {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSpecialChars: false, // No special chars for temp passwords
    });
  }

  /**
   * Check if password has been compromised (basic check)
   * @param password - Password to check
   * @returns True if password might be compromised
   */
  isPasswordCompromised(password: string): boolean {
    const compromisedPatterns = [
      'password',
      '123456',
      'qwerty',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'football',
      'abc123',
      'password123',
      'admin123',
      'root',
      'guest',
      'user',
      'test',
      'demo',
      'sample',
      'example',
    ];

    const lowerPassword = password.toLowerCase();
    return compromisedPatterns.some((pattern) =>
      lowerPassword.includes(pattern),
    );
  }

  /**
   * Get password strength description
   * @param score - Password strength score (0-4)
   * @returns Human-readable strength description
   */
  getPasswordStrengthDescription(score: number): string {
    switch (score) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Unknown';
    }
  }

  /**
   * Validate password change (ensure new password is different from old)
   * @param oldPassword - Current password
   * @param newPassword - New password
   * @returns Validation result
   */
  validatePasswordChange(
    oldPassword: string,
    newPassword: string,
  ): {
    isValid: boolean;
    feedback: string[];
  } {
    const feedback: string[] = [];

    // Check if passwords are the same
    if (oldPassword === newPassword) {
      feedback.push('New password must be different from the current password');
    }

    // Check if new password is too similar to old password
    const similarity = this.calculatePasswordSimilarity(
      oldPassword,
      newPassword,
    );
    if (similarity > 0.7) {
      feedback.push('New password is too similar to the current password');
    }

    // Validate new password strength
    const strengthValidation = this.validatePasswordStrength(newPassword);
    if (!strengthValidation.isValid) {
      feedback.push(...strengthValidation.feedback);
    }

    return {
      isValid: feedback.length === 0 && strengthValidation.isValid,
      feedback,
    };
  }

  /**
   * Calculate similarity between two passwords
   * @param password1 - First password
   * @param password2 - Second password
   * @returns Similarity score (0-1, where 1 is identical)
   */
  private calculatePasswordSimilarity(
    password1: string,
    password2: string,
  ): number {
    const longer = password1.length > password2.length ? password1 : password2;
    const shorter = password1.length > password2.length ? password2 : password1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(0) as number[]);

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate a secure salt
   * @param length - Length of the salt (default: 32)
   * @returns Random salt
   */
  generateSalt(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password with custom salt
   * @param password - Plain text password
   * @param salt - Custom salt
   * @returns Hashed password
   */
  async hashPasswordWithSalt(password: string, salt: string): Promise<string> {
    const saltRounds = authConfig().password.saltRounds;
    return await (bcrypt as any).hash(password + salt, saltRounds) as string;
  }
}

import * as crypto from 'crypto';

/**
 * Cryptographic Utilities
 *
 * This utility class provides secure encryption and decryption methods
 * for sensitive data in the Decode authentication system. It implements
 * AES-256-GCM encryption for authenticated encryption with additional data.
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - Random initialization vectors for each encryption
 * - PBKDF2 key derivation for enhanced security
 * - Authentication tags to prevent tampering
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */
export class CryptoUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations

  /**
   * Encrypts plaintext using AES-256-GCM with PBKDF2 key derivation
   *
   * @param secret - The encryption secret/password
   * @param plaintext - The data to encrypt
   * @returns Encrypted data as base64 string containing salt, iv, tag, and ciphertext
   * @throws Error if encryption fails
   */
  static encrypt(secret: string, plaintext: string): string {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Derive key using PBKDF2
      const key = crypto.pbkdf2Sync(
        secret,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        'sha256',
      );

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from('decode-auth', 'utf8')); // Additional authenticated data

      // Encrypt the plaintext
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine salt, iv, tag, and encrypted data
      const result = Buffer.concat([salt, iv, tag, encrypted]);

      return result.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed ${error}`);
    }
  }

  /**
   * Decrypts ciphertext using AES-256-GCM with PBKDF2 key derivation
   *
   * @param secret - The decryption secret/password
   * @param encryptedData - The encrypted data as base64 string
   * @returns Decrypted plaintext
   * @throws Error if decryption fails
   */
  static decrypt(secret: string, encryptedData: string): string {
    try {
      // Parse the encrypted data
      const data = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = data.subarray(0, this.SALT_LENGTH);
      const iv = data.subarray(
        this.SALT_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH,
      );
      const tag = data.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH,
      );
      const encrypted = data.subarray(
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH,
      );

      // Derive key using PBKDF2
      const key = crypto.pbkdf2Sync(
        secret,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        'sha256',
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAAD(Buffer.from('decode-auth', 'utf8')); // Additional authenticated data
      decipher.setAuthTag(tag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Generates a cryptographically secure random string
   *
   * @param length - Length of the random string in bytes
   * @param encoding - Encoding format ('hex', 'base64', 'base32')
   * @returns Random string in specified encoding
   */
  static generateRandomString(
    length: number = 32,
    encoding: 'hex' | 'base64' | 'base32' = 'hex',
  ): string {
    const bytes = crypto.randomBytes(length);

    switch (encoding) {
      case 'hex':
        return bytes.toString('hex');
      case 'base64':
        return bytes.toString('base64');
      case 'base32':
        return this.toBase32(bytes);
      default:
        return bytes.toString('hex');
    }
  }

  /**
   * Converts buffer to base32 encoding
   *
   * @param buffer - Buffer to convert
   * @returns Base32 encoded string
   */
  private static toBase32(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  /**
   * Creates a hash of the input string using SHA-256
   *
   * @param input - String to hash
   * @param encoding - Output encoding ('hex', 'base64')
   * @returns Hashed string
   */
  static hash(input: string, encoding: 'hex' | 'base64' = 'hex'): string {
    return crypto.createHash('sha256').update(input, 'utf8').digest(encoding);
  }

  /**
   * Compares two strings in constant time to prevent timing attacks
   *
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');

    return crypto.timingSafeEqual(bufferA, bufferB);
  }
}

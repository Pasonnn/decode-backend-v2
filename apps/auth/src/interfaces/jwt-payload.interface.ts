/**
 * @fileoverview JWT Payload Interface Definition
 *
 * This interface defines the structure of JWT token payloads used in the
 * Decode authentication system. It specifies the claims included in both
 * access tokens and session tokens.
 *
 * JWT Claims:
 * - user_id: Unique identifier for the authenticated user
 * - session_token: Optional session token reference
 * - iat: Issued at timestamp (standard JWT claim)
 * - exp: Expiration timestamp (standard JWT claim)
 * - iss: Issuer identifier (standard JWT claim)
 * - aud: Audience identifier (standard JWT claim)
 *
 * Security Considerations:
 * - User ID is the primary identifier for authentication
 * - Session token links access tokens to specific sessions
 * - Standard JWT claims provide additional security validation
 * - All timestamps are in Unix epoch format
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

/**
 * JWT Token Payload Interface
 *
 * This interface defines the structure of JWT token payloads used for
 * authentication and authorization in the system.
 *
 * @interface JwtPayload
 */
export interface JwtPayload {
  /** Unique identifier for the authenticated user */
  user_id: string;

  /** Optional session token reference for session management */
  session_token?: string;

  /** Issued at timestamp (standard JWT claim) */
  iat?: number;

  /** Expiration timestamp (standard JWT claim) */
  exp?: number;

  /** Issuer identifier (standard JWT claim) */
  iss?: string;

  /** Audience identifier (standard JWT claim) */
  aud?: string;
}

/**
 * @fileoverview Response Interface Definition
 *
 * This interface defines the standard response format used throughout the
 * Decode authentication system. It ensures consistent API responses across
 * all endpoints and services.
 *
 * Response Structure:
 * - success: Boolean indicating operation success/failure
 * - statusCode: HTTP status code for the response
 * - message: Human-readable message describing the result
 * - data: Optional payload data (success responses)
 * - error: Optional error details (failure responses)
 *
 * Benefits:
 * - Consistent API response format
 * - Clear success/failure indication
 * - Standardized error handling
 * - Type safety with generics
 * - Easy client-side response handling
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

/**
 * Standard API Response Interface
 *
 * This interface defines the structure for all API responses in the
 * authentication system. It provides a consistent format for both
 * success and error responses.
 *
 * @template T - Type of the data payload (optional)
 *
 * @interface Response
 */
export interface Response<T = unknown> {
  /** Indicates whether the operation was successful */
  success: boolean;

  /** HTTP status code for the response */
  statusCode: number;

  /** Human-readable message describing the result */
  message: string;

  /** Optional payload data for successful operations */
  data?: T;

  /** Optional error details for failed operations */
  error?: string | Record<string, unknown>;
}

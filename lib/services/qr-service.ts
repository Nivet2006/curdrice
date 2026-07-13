import crypto from 'crypto';

export interface TokenPayload {
  eventId: string;
  studentId: string;
  iat: number;
}

/**
 * Generates a unique QR token.
 * Defaults to a secure UUID. Can be scaled for signed/rotating cryptographic structures.
 */
export function generateQRToken(): string {
  return crypto.randomUUID();
}

/**
 * Validates the format and validity of a QR token.
 */
export function validateQRToken(token: string): boolean {
  if (!token) return false;
  // Validates standard UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

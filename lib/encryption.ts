// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string;

/**
 * Encrypts data for secure storage
 * @param data The data to encrypt
 * @returns Encrypted string representation of the data
 */
export function encryptData<T>(data: T): string {
  // Skip encryption on server
  if (typeof window === 'undefined') {
    return JSON.stringify(data || {});
  }

  // Validate encryption key
  if (
    !ENCRYPTION_KEY ||
    typeof ENCRYPTION_KEY !== 'string' ||
    ENCRYPTION_KEY.length !== 32
  ) {
    console.warn('Invalid ENCRYPTION_KEY - using fallback');
    return JSON.stringify(data || {});
  }

  try {
    // Ensure data is not undefined
    const jsonData = JSON.stringify(data || {});

    // Generate initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );

    // Encrypt data
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(jsonData, 'utf8')),
      cipher.final(),
    ]);

    // Return encrypted data with IV
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return JSON.stringify(data || {});
  }
}

/**
 * Decrypts data that was encrypted with encryptData
 * @param text The encrypted text to decrypt
 * @returns The original data
 */
export function decryptData<T = unknown>(text: string): T {
  // Skip decryption on server
  if (typeof window === 'undefined') {
    try {
      return JSON.parse(text);
    } catch {
      return {} as T;
    }
  }

  try {
    // Validate input
    if (!text || !text.includes(':')) {
      throw new Error('Invalid encrypted data format');
    }

    // Split IV and encrypted data
    const [ivHex, ...encryptedParts] = text.split(':');
    if (!ivHex || ivHex.length !== 32) {
      throw new Error('Invalid IV length');
    }

    // Convert hex to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedParts.join(':'), 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );

    // Decrypt data
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    // Parse and return decrypted data
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Decryption failed:', error);
    // Try to parse as JSON if decryption fails
    try {
      return JSON.parse(text);
    } catch {
      return {} as T;
    }
  }
}

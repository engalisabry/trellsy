import crypto from 'crypto';

// Only validate ENCRYPTION_KEY on client side
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string;

/**
 * Encrypts data for secure storage
 * @param data The data to encrypt
 * @returns Encrypted string representation of the data
 */
export function encryptData<T>(data: T): string {
  if (typeof window === 'undefined') return JSON.stringify(data); // Skip encryption on server

  if (typeof ENCRYPTION_KEY !== 'string' || ENCRYPTION_KEY.length !== 32) {
    console.warn('Invalid ENCRYPTION_KEY - using fallback');
    return JSON.stringify(data);
  }
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not set');
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(JSON.stringify(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts data that was encrypted with encryptData
 * @param text The encrypted text to decrypt
 * @returns The original data
 */
export function decryptData<T = unknown>(text: string): T {
  if (typeof window === 'undefined') return JSON.parse(text); // Skip decryption on server

  try {
    if (!text || !text.includes(':')) {
      throw new Error('Invalid encrypted data format');
    }
    const [ivHex, ...encryptedParts] = text.split(':');
    if (!ivHex || ivHex.length !== 32) {
      // 16 bytes in hex
      throw new Error('Invalid IV length');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (error) {
    console.error('Decryption failed:', error);
    // Only fallback if text is valid JSON
    try {
      return JSON.parse(text);
    } catch {
      return {} as T;
    }
  }
}

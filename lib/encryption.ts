import crypto from 'crypto';

// Only validate ENCRYPTION_KEY on client side
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string;

export function encryptData(data: any): string {
  if (typeof window === 'undefined') return JSON.stringify(data); // Skip encryption on server

  if (typeof ENCRYPTION_KEY !== 'string' || ENCRYPTION_KEY.length !== 32) {
    console.warn('Invalid ENCRYPTION_KEY - using fallback');
    return JSON.stringify(data);
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

export function decryptData<T = any>(text: string): T {
  if (typeof window === 'undefined') return JSON.parse(text); // Skip decryption on server

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
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
    return JSON.parse(text); // Fallback to plain text
  }
}

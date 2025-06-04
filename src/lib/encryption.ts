import crypto from 'crypto';

// Get encryption key from environment variable or use a default for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-encryption-key-32-chars';

// Ensure the key is the right length for AES-256
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));

/**
 * Encrypt sensitive data like API keys
 */
export function encryptData(text: string): string {
  if (!text) return '';
  
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher using AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY_BUFFER, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data as a single string
    // IV is needed for decryption and is safe to store with the encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data like API keys
 */
export function decryptData(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    // Split the IV from the encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY_BUFFER, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

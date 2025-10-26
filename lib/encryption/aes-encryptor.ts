import crypto from 'crypto';
import { IEncryptor, EncryptionResult, DecryptionResult, Algorithm, EncryptionMetadata } from '../../types';

/**
 * AES-256-CBC Encryptor implementation
 * Uses Node.js built-in crypto module for AES encryption with CBC mode
 */
export class AESEncryptor implements IEncryptor {
  private readonly algorithm = 'aes-256-cbc';
  private readonly keySize = 32; // 256 bits = 32 bytes
  private readonly ivSize = 16; // AES block size = 16 bytes

  /**
   * Encrypts data using AES-256-CBC
   * @param data - The plaintext data to encrypt
   * @param key - The 256-bit encryption key (32 bytes)
   * @returns Promise resolving to encryption result with timing and metadata
   */
  async encrypt(data: Buffer, key: Buffer): Promise<EncryptionResult> {
    // Validate key size
    if (key.length !== this.keySize) {
      throw new Error(`AES-256 requires a ${this.keySize}-byte key, got ${key.length} bytes`);
    }

    // Generate random IV
    const iv = crypto.randomBytes(this.ivSize);
    
    // Start timing
    const startTime = performance.now();
    
    try {
      // Create cipher with explicit IV
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      cipher.setAutoPadding(true); // PKCS7 padding
      
      // Encrypt data
      let ciphertext = cipher.update(data);
      ciphertext = Buffer.concat([ciphertext, cipher.final()]);
      
      // End timing
      const endTime = performance.now();
      const encryptionTime = endTime - startTime;
      
      // Create metadata
      const metadata: EncryptionMetadata = {
        algorithm: Algorithm.AES,
        mode: 'CBC',
        keySize: this.keySize * 8, // Convert to bits
        timestamp: new Date()
      };
      
      return {
        algorithm: Algorithm.AES,
        ciphertext,
        iv,
        encryptionTime,
        ciphertextSize: ciphertext.length,
        metadata
      };
    } catch (error) {
      throw new Error(`AES encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypts AES-256-CBC encrypted data
   * @param ciphertext - The encrypted data to decrypt
   * @param key - The 256-bit decryption key (32 bytes)
   * @param iv - The initialization vector used during encryption
   * @returns Promise resolving to decryption result with timing
   */
  async decrypt(ciphertext: Buffer, key: Buffer, iv?: Buffer): Promise<DecryptionResult> {
    // Validate inputs
    if (key.length !== this.keySize) {
      throw new Error(`AES-256 requires a ${this.keySize}-byte key, got ${key.length} bytes`);
    }
    
    if (!iv) {
      throw new Error('IV is required for AES-CBC decryption');
    }
    
    if (iv.length !== this.ivSize) {
      throw new Error(`AES requires a ${this.ivSize}-byte IV, got ${iv.length} bytes`);
    }

    // Start timing
    const startTime = performance.now();
    
    try {
      // Create decipher with explicit IV
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAutoPadding(true); // PKCS7 padding
      
      // Decrypt data
      let plaintext = decipher.update(ciphertext);
      plaintext = Buffer.concat([plaintext, decipher.final()]);
      
      // End timing
      const endTime = performance.now();
      const decryptionTime = endTime - startTime;
      
      return {
        plaintext,
        decryptionTime,
        algorithm: Algorithm.AES
      };
    } catch (error) {
      throw new Error(`AES decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
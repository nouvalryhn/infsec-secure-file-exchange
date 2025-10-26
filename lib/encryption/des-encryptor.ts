import crypto from 'crypto';
import { IEncryptor, EncryptionResult, DecryptionResult, Algorithm, EncryptionMetadata } from '../../types';

/**
 * DES-CBC Encryptor implementation
 * Uses Node.js built-in crypto module for DES encryption with CBC mode
 */
export class DESEncryptor implements IEncryptor {
  private readonly algorithm = 'des-ede3-cbc'; // Use 3DES instead of DES
  private readonly keySize = 24; // 3DES uses 192-bit keys (24 bytes)
  private readonly ivSize = 8; // DES block size = 8 bytes

  /**
   * Encrypts data using DES-CBC
   * @param data - The plaintext data to encrypt
   * @param key - The 64-bit encryption key (8 bytes)
   * @returns Promise resolving to encryption result with timing and metadata
   */
  async encrypt(data: Buffer, key: Buffer): Promise<EncryptionResult> {
    // Validate key size
    if (key.length !== this.keySize) {
      throw new Error(`3DES requires a ${this.keySize}-byte key, got ${key.length} bytes`);
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
        algorithm: Algorithm.DES,
        mode: 'CBC',
        keySize: 168, // Effective key size in bits for 3DES
        timestamp: new Date()
      };
      
      return {
        algorithm: Algorithm.DES,
        ciphertext,
        iv,
        encryptionTime,
        ciphertextSize: ciphertext.length,
        metadata
      };
    } catch (error) {
      throw new Error(`3DES encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypts 3DES-CBC encrypted data
   * @param ciphertext - The encrypted data to decrypt
   * @param key - The 64-bit decryption key (8 bytes)
   * @param iv - The initialization vector used during encryption
   * @returns Promise resolving to decryption result with timing
   */
  async decrypt(ciphertext: Buffer, key: Buffer, iv?: Buffer): Promise<DecryptionResult> {
    // Validate inputs
    if (key.length !== this.keySize) {
      throw new Error(`3DES requires a ${this.keySize}-byte key, got ${key.length} bytes`);
    }
    
    if (!iv) {
      throw new Error('IV is required for 3DES-CBC decryption');
    }
    
    if (iv.length !== this.ivSize) {
      throw new Error(`3DES requires a ${this.ivSize}-byte IV, got ${iv.length} bytes`);
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
        algorithm: Algorithm.DES
      };
    } catch (error) {
      throw new Error(`3DES decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
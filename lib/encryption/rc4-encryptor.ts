import CryptoJS from 'crypto-js';
import { IEncryptor, EncryptionResult, DecryptionResult, Algorithm, EncryptionMetadata } from '../../types';

/**
 * RC4 Stream Cipher Encryptor implementation
 * Uses crypto-js library for RC4 encryption (stream cipher)
 */
export class RC4Encryptor implements IEncryptor {
  private readonly keySize = 16; // 128-bit key (16 bytes) - common RC4 key size

  /**
   * Encrypts data using RC4 stream cipher
   * @param data - The plaintext data to encrypt
   * @param key - The encryption key (16 bytes for 128-bit)
   * @returns Promise resolving to encryption result with timing and metadata
   */
  async encrypt(data: Buffer, key: Buffer): Promise<EncryptionResult> {
    // Validate key size
    if (key.length !== this.keySize) {
      throw new Error(`RC4 requires a ${this.keySize}-byte key, got ${key.length} bytes`);
    }

    // Start timing
    const startTime = performance.now();
    
    try {
      // Convert Buffer to hex string for crypto-js
      const keyHex = key.toString('hex');
      const dataHex = data.toString('hex');
      
      // Convert to WordArray
      const keyWordArray = CryptoJS.enc.Hex.parse(keyHex);
      const dataWordArray = CryptoJS.enc.Hex.parse(dataHex);
      
      // Encrypt using RC4
      const encrypted = CryptoJS.RC4.encrypt(dataWordArray, keyWordArray);
      
      // Convert result back to Buffer
      const ciphertext = Buffer.from(encrypted.ciphertext.toString(CryptoJS.enc.Base64), 'base64');
      
      // End timing
      const endTime = performance.now();
      const encryptionTime = endTime - startTime;
      
      // Create metadata
      const metadata: EncryptionMetadata = {
        algorithm: Algorithm.RC4,
        mode: 'Stream', // RC4 is a stream cipher, no block mode
        keySize: this.keySize * 8, // Convert to bits
        timestamp: new Date()
      };
      
      return {
        algorithm: Algorithm.RC4,
        ciphertext,
        // RC4 is a stream cipher, no IV needed
        encryptionTime,
        ciphertextSize: ciphertext.length,
        metadata
      };
    } catch (error) {
      throw new Error(`RC4 encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypts RC4 encrypted data
   * @param ciphertext - The encrypted data to decrypt
   * @param key - The decryption key (same as encryption key for symmetric)
   * @param iv - Not used for RC4 (stream cipher), included for interface compatibility
   * @returns Promise resolving to decryption result with timing
   */
  async decrypt(ciphertext: Buffer, key: Buffer, iv?: Buffer): Promise<DecryptionResult> {
    // Validate key size
    if (key.length !== this.keySize) {
      throw new Error(`RC4 requires a ${this.keySize}-byte key, got ${key.length} bytes`);
    }

    // Start timing
    const startTime = performance.now();
    
    try {
      // Convert key to hex string for crypto-js
      const keyHex = key.toString('hex');
      const keyWordArray = CryptoJS.enc.Hex.parse(keyHex);
      
      // Create CipherParams object from ciphertext
      const ciphertextBase64 = ciphertext.toString('base64');
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(ciphertextBase64)
      });
      
      // Decrypt using RC4
      const decrypted = CryptoJS.RC4.decrypt(cipherParams, keyWordArray);
      
      // Convert result back to Buffer using hex encoding
      const plaintextHex = decrypted.toString(CryptoJS.enc.Hex);
      const plaintext = Buffer.from(plaintextHex, 'hex');
      
      // End timing
      const endTime = performance.now();
      const decryptionTime = endTime - startTime;
      
      return {
        plaintext,
        decryptionTime,
        algorithm: Algorithm.RC4
      };
    } catch (error) {
      throw new Error(`RC4 decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
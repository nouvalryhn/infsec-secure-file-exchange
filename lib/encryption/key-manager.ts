import crypto from 'crypto';
import { Algorithm, KeyGenerationOptions, SessionKeyData } from '../../types';

/**
 * Key Management Utilities for the Secure File Exchange System
 * Provides secure key generation, derivation, and session key management
 */
export class KeyManager {
  
  /**
   * Generates a cryptographically secure random key for the specified algorithm
   * @param algorithm - The encryption algorithm to generate a key for
   * @returns Buffer containing the generated key
   */
  static generateKey(algorithm: Algorithm): Buffer {
    let keySize: number;
    
    switch (algorithm) {
      case Algorithm.AES:
        keySize = 32; // 256 bits
        break;
      case Algorithm.DES:
        keySize = 24; // 192 bits for 3DES
        break;
      case Algorithm.RC4:
        keySize = 16; // 128 bits
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    return crypto.randomBytes(keySize);
  }

  /**
   * Generates a key with specific options
   * @param options - Key generation options including size and algorithm
   * @returns Buffer containing the generated key
   */
  static generateKeyWithOptions(options: KeyGenerationOptions): Buffer {
    if (options.keySize <= 0) {
      throw new Error('Key size must be positive');
    }
    
    return crypto.randomBytes(options.keySize);
  }

  /**
   * Generates a session key for user authentication
   * @param algorithm - The algorithm this session key will be used with (default: AES)
   * @returns SessionKeyData containing the key and metadata
   */
  static generateSessionKey(algorithm: Algorithm = Algorithm.AES): SessionKeyData {
    const key = this.generateKey(algorithm);
    
    return {
      key,
      algorithm,
      createdAt: new Date()
    };
  }

  /**
   * Derives a file-specific key from a session key and file identifier
   * This ensures each file has a unique encryption key while being derivable from the session
   * @param sessionKey - The user's session key
   * @param fileId - Unique identifier for the file
   * @param algorithm - Target algorithm for the derived key
   * @returns Buffer containing the derived key
   */
  static deriveFileKey(sessionKey: Buffer, fileId: string, algorithm: Algorithm): Buffer {
    if (!sessionKey || sessionKey.length === 0) {
      throw new Error('Session key cannot be empty');
    }
    
    if (!fileId || fileId.trim().length === 0) {
      throw new Error('File ID cannot be empty');
    }

    // Create a deterministic but unique key for this file
    // Using HMAC-SHA256 for key derivation
    const hmac = crypto.createHmac('sha256', sessionKey);
    hmac.update(fileId);
    hmac.update(algorithm); // Include algorithm in derivation for algorithm-specific keys
    
    const derivedHash = hmac.digest();
    
    // Truncate or pad to the required key size for the algorithm
    let targetKeySize: number;
    switch (algorithm) {
      case Algorithm.AES:
        targetKeySize = 32; // 256 bits
        break;
      case Algorithm.DES:
        targetKeySize = 24; // 192 bits for 3DES
        break;
      case Algorithm.RC4:
        targetKeySize = 16; // 128 bits
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    // Return the first N bytes of the hash for the required key size
    return derivedHash.subarray(0, targetKeySize);
  }

  /**
   * Derives a user-specific master key from username and session data
   * This can be used to create consistent keys across sessions for the same user
   * @param username - The user's username
   * @param sessionSalt - Random salt for this session
   * @param algorithm - Target algorithm for the derived key
   * @returns Buffer containing the derived master key
   */
  static deriveMasterKey(username: string, sessionSalt: Buffer, algorithm: Algorithm): Buffer {
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    
    if (!sessionSalt || sessionSalt.length === 0) {
      throw new Error('Session salt cannot be empty');
    }

    // Use PBKDF2 for key derivation with username as password and session salt
    const iterations = 10000; // Standard number of iterations for PBKDF2
    let keyLength: number;
    
    switch (algorithm) {
      case Algorithm.AES:
        keyLength = 32; // 256 bits
        break;
      case Algorithm.DES:
        keyLength = 24; // 192 bits for 3DES
        break;
      case Algorithm.RC4:
        keyLength = 16; // 128 bits
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    return crypto.pbkdf2Sync(username, sessionSalt, iterations, keyLength, 'sha256');
  }

  /**
   * Validates that a key is appropriate for the specified algorithm
   * @param key - The key to validate
   * @param algorithm - The algorithm the key will be used with
   * @returns boolean indicating if the key is valid
   */
  static validateKey(key: Buffer, algorithm: Algorithm): boolean {
    if (!key) {
      return false;
    }
    
    let expectedSize: number;
    switch (algorithm) {
      case Algorithm.AES:
        expectedSize = 32; // 256 bits
        break;
      case Algorithm.DES:
        expectedSize = 24; // 192 bits for 3DES
        break;
      case Algorithm.RC4:
        expectedSize = 16; // 128 bits
        break;
      default:
        return false;
    }
    
    return key.length === expectedSize;
  }

  /**
   * Securely wipes a key from memory by overwriting it with random data
   * @param key - The key buffer to wipe
   */
  static wipeKey(key: Buffer): void {
    if (key && key.length > 0) {
      // Overwrite with random data
      crypto.randomFillSync(key);
      // Then overwrite with zeros
      key.fill(0);
    }
  }
}
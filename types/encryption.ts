/**
 * Encryption service types and interfaces for the Secure File Exchange System
 */

// Enums for algorithm and data type classification
export enum Algorithm {
  AES = 'AES',
  DES = 'DES',
  RC4 = 'RC4'
}

export enum DataType {
  NUMERICAL = 'NUMERICAL',
  SPREADSHEET = 'SPREADSHEET',
  IMAGE = 'IMAGE'
}

// Core encryption metadata interface
export interface EncryptionMetadata {
  algorithm: Algorithm;
  mode: string; // CBC, CFB, OFB, CTR for block ciphers
  keySize: number; // Key size in bits
  timestamp: Date;
}

// Result interfaces for encryption and decryption operations
export interface EncryptionResult {
  algorithm: Algorithm;
  ciphertext: Buffer;
  iv?: Buffer; // Initialization Vector for block ciphers (not used for RC4)
  encryptionTime: number; // Time taken in milliseconds
  ciphertextSize: number; // Size of ciphertext in bytes
  metadata: EncryptionMetadata;
}

export interface DecryptionResult {
  plaintext: Buffer;
  decryptionTime: number; // Time taken in milliseconds
  algorithm: Algorithm;
}

// Core encryptor interface that all encryption implementations must follow
export interface IEncryptor {
  /**
   * Encrypts the provided data using the specified key
   * @param data - The plaintext data to encrypt
   * @param key - The encryption key
   * @returns Promise resolving to encryption result with timing and metadata
   */
  encrypt(data: Buffer, key: Buffer): Promise<EncryptionResult>;

  /**
   * Decrypts the provided ciphertext using the specified key
   * @param ciphertext - The encrypted data to decrypt
   * @param key - The decryption key (same as encryption key for symmetric)
   * @param iv - Initialization vector for block ciphers (optional for stream ciphers)
   * @returns Promise resolving to decryption result with timing
   */
  decrypt(ciphertext: Buffer, key: Buffer, iv?: Buffer): Promise<DecryptionResult>;
}

// Additional types for key management
export interface KeyGenerationOptions {
  keySize: number; // Key size in bytes
  algorithm: Algorithm;
}

export interface SessionKeyData {
  key: Buffer;
  algorithm: Algorithm;
  createdAt: Date;
}

// Performance metrics interface for tracking encryption operations
export interface PerformanceMetrics {
  algorithm: Algorithm;
  encryptionTime: number;
  decryptionTime?: number;
  ciphertextSize: number;
  dataType: DataType;
  timestamp: Date;
}
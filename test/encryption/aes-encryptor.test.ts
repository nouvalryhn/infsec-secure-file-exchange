import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { AESEncryptor } from '@/lib/encryption/aes-encryptor'
import { Algorithm } from '@/types/encryption'

describe('AESEncryptor', () => {
  const encryptor = new AESEncryptor()
  
  // Test data
  const testData = Buffer.from('Hello, World! This is a test message for AES encryption.')
  const validKey = crypto.randomBytes(32) // 256-bit key
  const invalidKey = crypto.randomBytes(16) // 128-bit key (invalid for AES-256)

  describe('encrypt', () => {
    it('should encrypt data successfully with valid key', async () => {
      const result = await encryptor.encrypt(testData, validKey)
      
      expect(result.algorithm).toBe(Algorithm.AES)
      expect(result.ciphertext).toBeInstanceOf(Buffer)
      expect(result.ciphertext.length).toBeGreaterThan(0)
      expect(result.iv).toBeInstanceOf(Buffer)
      expect(result.iv?.length).toBe(16) // AES block size
      expect(result.encryptionTime).toBeGreaterThan(0)
      expect(result.ciphertextSize).toBe(result.ciphertext.length)
      expect(result.metadata.algorithm).toBe(Algorithm.AES)
      expect(result.metadata.mode).toBe('CBC')
      expect(result.metadata.keySize).toBe(256)
      expect(result.metadata.timestamp).toBeInstanceOf(Date)
    })

    it('should throw error with invalid key size', async () => {
      await expect(encryptor.encrypt(testData, invalidKey))
        .rejects.toThrow('AES-256 requires a 32-byte key, got 16 bytes')
    })

    it('should produce different ciphertext for same data (due to random IV)', async () => {
      const result1 = await encryptor.encrypt(testData, validKey)
      const result2 = await encryptor.encrypt(testData, validKey)
      
      expect(result1.ciphertext).not.toEqual(result2.ciphertext)
      expect(result1.iv).not.toEqual(result2.iv)
    })
  })

  describe('decrypt', () => {
    it('should decrypt data successfully', async () => {
      // First encrypt some data
      const encryptResult = await encryptor.encrypt(testData, validKey)
      
      // Then decrypt it
      const decryptResult = await encryptor.decrypt(
        encryptResult.ciphertext,
        validKey,
        encryptResult.iv
      )
      
      expect(decryptResult.plaintext).toEqual(testData)
      expect(decryptResult.algorithm).toBe(Algorithm.AES)
      expect(decryptResult.decryptionTime).toBeGreaterThan(0)
    })

    it('should throw error with invalid key size', async () => {
      const encryptResult = await encryptor.encrypt(testData, validKey)
      
      await expect(encryptor.decrypt(encryptResult.ciphertext, invalidKey, encryptResult.iv))
        .rejects.toThrow('AES-256 requires a 32-byte key, got 16 bytes')
    })

    it('should throw error without IV', async () => {
      const encryptResult = await encryptor.encrypt(testData, validKey)
      
      await expect(encryptor.decrypt(encryptResult.ciphertext, validKey))
        .rejects.toThrow('IV is required for AES-CBC decryption')
    })

    it('should throw error with invalid IV size', async () => {
      const encryptResult = await encryptor.encrypt(testData, validKey)
      const invalidIV = crypto.randomBytes(8) // Wrong size
      
      await expect(encryptor.decrypt(encryptResult.ciphertext, validKey, invalidIV))
        .rejects.toThrow('AES requires a 16-byte IV, got 8 bytes')
    })
  })

  describe('encrypt/decrypt round trip', () => {
    it('should successfully encrypt and decrypt various data sizes', async () => {
      const testCases = [
        Buffer.from('Short'),
        Buffer.from('Medium length test data for encryption'),
        Buffer.from('A'.repeat(1000)), // Long data
        Buffer.alloc(0), // Empty buffer
      ]

      for (const data of testCases) {
        const encryptResult = await encryptor.encrypt(data, validKey)
        const decryptResult = await encryptor.decrypt(
          encryptResult.ciphertext,
          validKey,
          encryptResult.iv
        )
        
        expect(decryptResult.plaintext).toEqual(data)
      }
    })
  })
})
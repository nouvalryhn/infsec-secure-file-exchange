import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { RC4Encryptor } from '@/lib/encryption/rc4-encryptor'
import { Algorithm } from '@/types/encryption'

describe('RC4Encryptor', () => {
  const encryptor = new RC4Encryptor()
  
  // Test data
  const testData = Buffer.from('Hello, World! This is a test message for RC4 encryption.')
  const validKey = crypto.randomBytes(16) // 128-bit key
  const invalidKey = crypto.randomBytes(8) // 64-bit key (invalid for this implementation)

  describe('encrypt', () => {
    it('should encrypt data successfully with valid key', async () => {
      const result = await encryptor.encrypt(testData, validKey)
      
      expect(result.algorithm).toBe(Algorithm.RC4)
      expect(result.ciphertext).toBeInstanceOf(Buffer)
      expect(result.ciphertext.length).toBeGreaterThan(0)
      expect(result.iv).toBeUndefined() // RC4 doesn't use IV
      expect(result.encryptionTime).toBeGreaterThan(0)
      expect(result.ciphertextSize).toBe(result.ciphertext.length)
      expect(result.metadata.algorithm).toBe(Algorithm.RC4)
      expect(result.metadata.mode).toBe('Stream')
      expect(result.metadata.keySize).toBe(128)
      expect(result.metadata.timestamp).toBeInstanceOf(Date)
    })

    it('should throw error with invalid key size', async () => {
      await expect(encryptor.encrypt(testData, invalidKey))
        .rejects.toThrow('RC4 requires a 16-byte key, got 8 bytes')
    })

    it('should produce same ciphertext for same data and key (deterministic)', async () => {
      const result1 = await encryptor.encrypt(testData, validKey)
      const result2 = await encryptor.encrypt(testData, validKey)
      
      // RC4 is deterministic with same key and data
      expect(result1.ciphertext).toEqual(result2.ciphertext)
    })
  })

  describe('decrypt', () => {
    it('should decrypt data successfully', async () => {
      // First encrypt some data
      const encryptResult = await encryptor.encrypt(testData, validKey)
      
      // Then decrypt it
      const decryptResult = await encryptor.decrypt(
        encryptResult.ciphertext,
        validKey
      )
      
      expect(decryptResult.plaintext).toEqual(testData)
      expect(decryptResult.algorithm).toBe(Algorithm.RC4)
      expect(decryptResult.decryptionTime).toBeGreaterThan(0)
    })

    it('should throw error with invalid key size', async () => {
      const encryptResult = await encryptor.encrypt(testData, validKey)
      
      await expect(encryptor.decrypt(encryptResult.ciphertext, invalidKey))
        .rejects.toThrow('RC4 requires a 16-byte key, got 8 bytes')
    })

    it('should work without IV parameter (stream cipher)', async () => {
      const encryptResult = await encryptor.encrypt(testData, validKey)
      
      // Should work fine without IV
      const decryptResult = await encryptor.decrypt(encryptResult.ciphertext, validKey)
      expect(decryptResult.plaintext).toEqual(testData)
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
          validKey
        )
        
        expect(decryptResult.plaintext).toEqual(data)
      }
    })
  })
})
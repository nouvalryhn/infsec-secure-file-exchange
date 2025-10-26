import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('Password utilities', () => {
  const testPassword = 'TestPassword123!'
  const wrongPassword = 'WrongPassword456!'

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const hash = await hashPassword(testPassword)
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
      expect(hash).not.toBe(testPassword) // Should not be plain text
      expect(hash.startsWith('$2b$12$')).toBe(true) // bcrypt format with 12 rounds
    })

    it('should produce different hashes for same password (due to salt)', async () => {
      const hash1 = await hashPassword(testPassword)
      const hash2 = await hashPassword(testPassword)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty password', async () => {
      const hash = await hashPassword('')
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.startsWith('$2b$12$')).toBe(true)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword(testPassword)
      const isValid = await verifyPassword(testPassword, hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const hash = await hashPassword(testPassword)
      const isValid = await verifyPassword(wrongPassword, hash)
      
      expect(isValid).toBe(false)
    })

    it('should handle empty password verification', async () => {
      const hash = await hashPassword('')
      const isValid = await verifyPassword('', hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject empty password against non-empty hash', async () => {
      const hash = await hashPassword(testPassword)
      const isValid = await verifyPassword('', hash)
      
      expect(isValid).toBe(false)
    })

    it('should handle invalid hash format', async () => {
      // bcrypt.compare returns false for invalid hashes rather than throwing
      const isValid = await verifyPassword(testPassword, 'invalid-hash')
      expect(isValid).toBe(false)
    })
  })

  describe('password security', () => {
    it('should use sufficient salt rounds (12)', async () => {
      const hash = await hashPassword(testPassword)
      
      // bcrypt hash format: $2b$rounds$salt+hash
      const parts = hash.split('$')
      expect(parts[2]).toBe('12') // Salt rounds
    })

    it('should handle various password lengths', async () => {
      const passwords = [
        'a', // Very short
        'short',
        'medium_length_password',
        'very_long_password_with_many_characters_and_symbols_!@#$%^&*()',
      ]

      for (const password of passwords) {
        const hash = await hashPassword(password)
        const isValid = await verifyPassword(password, hash)
        
        expect(isValid).toBe(true)
      }
    })
  })
})
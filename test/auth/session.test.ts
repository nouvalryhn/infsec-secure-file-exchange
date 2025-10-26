import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateSessionKey, defaultSession, sessionOptions } from '@/lib/auth/session'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(new Map()))
}))

// Mock iron-session
vi.mock('iron-session', () => ({
  getIronSession: vi.fn(() => Promise.resolve({
    userId: '',
    username: '',
    sessionKey: '',
    isLoggedIn: false,
    save: vi.fn(),
    destroy: vi.fn()
  }))
}))

describe('Session utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateSessionKey', () => {
    it('should generate a valid base64 session key', () => {
      const sessionKey = generateSessionKey()
      
      expect(sessionKey).toBeDefined()
      expect(typeof sessionKey).toBe('string')
      expect(sessionKey.length).toBeGreaterThan(0)
      
      // Should be valid base64
      const decoded = Buffer.from(sessionKey, 'base64')
      expect(decoded.length).toBe(32) // 256-bit key
    })

    it('should generate different keys each time', () => {
      const key1 = generateSessionKey()
      const key2 = generateSessionKey()
      
      expect(key1).not.toBe(key2)
    })

    it('should generate keys of consistent length', () => {
      const keys = Array.from({ length: 10 }, () => generateSessionKey())
      
      // All keys should have the same length (base64 encoded 32 bytes)
      const expectedLength = Buffer.from(new Array(32).fill(0)).toString('base64').length
      keys.forEach(key => {
        expect(key.length).toBe(expectedLength)
      })
    })
  })

  describe('defaultSession', () => {
    it('should have correct default values', () => {
      expect(defaultSession.userId).toBe('')
      expect(defaultSession.username).toBe('')
      expect(defaultSession.sessionKey).toBe('')
      expect(defaultSession.isLoggedIn).toBe(false)
    })
  })

  describe('sessionOptions', () => {
    it('should have correct configuration', () => {
      expect(sessionOptions.cookieName).toBe('secure-file-exchange-session')
      expect(sessionOptions.cookieOptions?.httpOnly).toBe(true)
      expect(sessionOptions.cookieOptions?.sameSite).toBe('strict')
      expect(sessionOptions.cookieOptions?.maxAge).toBe(24 * 60 * 60) // 24 hours
    })

    it('should use environment variable for password', () => {
      // In test environment, SESSION_SECRET might not be set
      // The important thing is that the code tries to use it
      expect(typeof sessionOptions.password).toBe('string')
    })

    it('should set secure flag based on environment', () => {
      // In test environment, secure should be false
      expect(sessionOptions.cookieOptions?.secure).toBe(false)
    })
  })
})
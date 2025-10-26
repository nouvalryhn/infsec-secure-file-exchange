import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkFileAccess, verifyFileAccess } from '@/lib/services/access-control'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    file: {
      findFirst: vi.fn()
    },
    fileShare: {
      findFirst: vi.fn()
    }
  }
}))

import { prisma } from '@/lib/prisma'
const mockPrisma = vi.mocked(prisma)

describe('Access Control Service', () => {
  const testUserId = 'user-123'
  const testFileId = 'file-456'
  const otherUserId = 'user-789'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkFileAccess', () => {
    it('should return OWNER access when user owns the file', async () => {
      mockPrisma.file.findFirst.mockResolvedValue({ id: testFileId })
      
      const result = await checkFileAccess(testUserId, testFileId)
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessType).toBe('OWNER')
      expect(mockPrisma.file.findFirst).toHaveBeenCalledWith({
        where: {
          id: testFileId,
          userId: testUserId
        },
        select: {
          id: true
        }
      })
    })

    it('should return SHARED access when file is shared with user', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null) // User doesn't own file
      mockPrisma.fileShare.findFirst.mockResolvedValue({ id: 'share-123' })
      
      const result = await checkFileAccess(testUserId, testFileId)
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessType).toBe('SHARED')
      expect(mockPrisma.fileShare.findFirst).toHaveBeenCalledWith({
        where: {
          fileId: testFileId,
          sharedWithUserId: testUserId
        },
        select: {
          id: true
        }
      })
    })

    it('should return NONE access when user has no access', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null)
      mockPrisma.fileShare.findFirst.mockResolvedValue(null)
      
      const result = await checkFileAccess(testUserId, testFileId)
      
      expect(result.hasAccess).toBe(false)
      expect(result.accessType).toBe('NONE')
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.file.findFirst.mockRejectedValue(new Error('Database error'))
      
      const result = await checkFileAccess(testUserId, testFileId)
      
      expect(result.hasAccess).toBe(false)
      expect(result.accessType).toBe('NONE')
    })

    it('should check ownership before checking shares', async () => {
      mockPrisma.file.findFirst.mockResolvedValue({ id: testFileId })
      
      await checkFileAccess(testUserId, testFileId)
      
      expect(mockPrisma.file.findFirst).toHaveBeenCalled()
      expect(mockPrisma.fileShare.findFirst).not.toHaveBeenCalled()
    })
  })

  describe('verifyFileAccess', () => {
    it('should return access type when user has access', async () => {
      mockPrisma.file.findFirst.mockResolvedValue({ id: testFileId })
      
      const accessType = await verifyFileAccess(testUserId, testFileId)
      
      expect(accessType).toBe('OWNER')
    })

    it('should throw error when user has no access', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null)
      mockPrisma.fileShare.findFirst.mockResolvedValue(null)
      
      await expect(verifyFileAccess(testUserId, testFileId))
        .rejects.toThrow('Access denied: You do not have permission to access this file')
    })

    it('should work with shared access', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null)
      mockPrisma.fileShare.findFirst.mockResolvedValue({ id: 'share-123' })
      
      const accessType = await verifyFileAccess(testUserId, testFileId)
      
      expect(accessType).toBe('SHARED')
    })
  })

  describe('access control scenarios', () => {
    it('should handle multiple users accessing same file', async () => {
      // Owner access
      mockPrisma.file.findFirst.mockResolvedValueOnce({ id: testFileId })
      const ownerResult = await checkFileAccess(testUserId, testFileId)
      expect(ownerResult.accessType).toBe('OWNER')

      // Shared user access
      mockPrisma.file.findFirst.mockResolvedValueOnce(null)
      mockPrisma.fileShare.findFirst.mockResolvedValueOnce({ id: 'share-123' })
      const sharedResult = await checkFileAccess(otherUserId, testFileId)
      expect(sharedResult.accessType).toBe('SHARED')

      // No access user
      mockPrisma.file.findFirst.mockResolvedValueOnce(null)
      mockPrisma.fileShare.findFirst.mockResolvedValueOnce(null)
      const noAccessResult = await checkFileAccess('user-999', testFileId)
      expect(noAccessResult.accessType).toBe('NONE')
    })

    it('should handle non-existent file', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null)
      mockPrisma.fileShare.findFirst.mockResolvedValue(null)
      
      const result = await checkFileAccess(testUserId, 'non-existent-file')
      
      expect(result.hasAccess).toBe(false)
      expect(result.accessType).toBe('NONE')
    })

    it('should handle empty user ID', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null)
      mockPrisma.fileShare.findFirst.mockResolvedValue(null)
      
      const result = await checkFileAccess('', testFileId)
      
      expect(result.hasAccess).toBe(false)
      expect(result.accessType).toBe('NONE')
    })

    it('should handle empty file ID', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null)
      mockPrisma.fileShare.findFirst.mockResolvedValue(null)
      
      const result = await checkFileAccess(testUserId, '')
      
      expect(result.hasAccess).toBe(false)
      expect(result.accessType).toBe('NONE')
    })
  })
})
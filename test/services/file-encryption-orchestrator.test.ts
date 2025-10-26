import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileEncryptionOrchestrator } from '@/lib/services/file-encryption-orchestrator'
import { Algorithm } from '@/types/encryption'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// Mock fs operations
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn()
  }
}))

const mockFs = vi.mocked(fs)

describe('FileEncryptionOrchestrator', () => {
  let orchestrator: FileEncryptionOrchestrator
  const testUploadDir = '/test/uploads'
  const testFileId = 'test-file-123'
  const testFileBuffer = Buffer.from('Test file content for encryption testing')

  beforeEach(() => {
    orchestrator = new FileEncryptionOrchestrator(testUploadDir)
    vi.clearAllMocks()
    
    // Mock fs operations to succeed by default
    mockFs.access.mockResolvedValue(undefined)
    mockFs.mkdir.mockResolvedValue(undefined)
    mockFs.writeFile.mockResolvedValue(undefined)
    mockFs.readFile.mockResolvedValue(Buffer.from('mock-encrypted-data'))
    mockFs.unlink.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ensureDirectories', () => {
    it('should create directories if they do not exist', async () => {
      // Mock access to fail (directory doesn't exist)
      mockFs.access.mockRejectedValue(new Error('Directory not found'))
      
      await orchestrator.ensureDirectories()
      
      expect(mockFs.mkdir).toHaveBeenCalledTimes(3)
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testUploadDir, 'aes'), { recursive: true })
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testUploadDir, 'des'), { recursive: true })
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testUploadDir, 'rc4'), { recursive: true })
    })

    it('should not create directories if they already exist', async () => {
      // Mock access to succeed (directories exist)
      mockFs.access.mockResolvedValue(undefined)
      
      await orchestrator.ensureDirectories()
      
      expect(mockFs.mkdir).not.toHaveBeenCalled()
    })
  })

  describe('encryptFile', () => {
    it('should encrypt file with all three algorithms', async () => {
      const result = await orchestrator.encryptFile(testFileBuffer, testFileId)
      
      expect(result).toHaveProperty('aes')
      expect(result).toHaveProperty('des')
      expect(result).toHaveProperty('rc4')
      
      expect(result.aes.algorithm).toBe(Algorithm.AES)
      expect(result.des.algorithm).toBe(Algorithm.DES)
      expect(result.rc4.algorithm).toBe(Algorithm.RC4)
      
      expect(result.aes.filePath).toBe(`aes/${testFileId}.enc`)
      expect(result.des.filePath).toBe(`des/${testFileId}.enc`)
      expect(result.rc4.filePath).toBe(`rc4/${testFileId}.enc`)
      
      // Verify files were written
      expect(mockFs.writeFile).toHaveBeenCalledTimes(3)
    })

    it('should measure encryption time for all algorithms', async () => {
      const result = await orchestrator.encryptFile(testFileBuffer, testFileId)
      
      expect(result.aes.encryptionTime).toBeGreaterThan(0)
      expect(result.des.encryptionTime).toBeGreaterThan(0)
      expect(result.rc4.encryptionTime).toBeGreaterThan(0)
    })

    it('should generate different ciphertext for each algorithm', async () => {
      const result = await orchestrator.encryptFile(testFileBuffer, testFileId)
      
      expect(result.aes.ciphertext).not.toEqual(result.des.ciphertext)
      expect(result.aes.ciphertext).not.toEqual(result.rc4.ciphertext)
      expect(result.des.ciphertext).not.toEqual(result.rc4.ciphertext)
    })
  })

  describe('encryptWithAlgorithm', () => {
    it('should encrypt with AES algorithm', async () => {
      const result = await orchestrator.encryptWithAlgorithm(testFileBuffer, Algorithm.AES, testFileId)
      
      expect(result.algorithm).toBe(Algorithm.AES)
      expect(result.filePath).toBe(`aes/${testFileId}.enc`)
      expect(result.encryptionTime).toBeGreaterThan(0)
      expect(result.ciphertext).toBeInstanceOf(Buffer)
      expect(result.iv).toBeInstanceOf(Buffer)
    })

    it('should encrypt with DES algorithm', async () => {
      const result = await orchestrator.encryptWithAlgorithm(testFileBuffer, Algorithm.DES, testFileId)
      
      expect(result.algorithm).toBe(Algorithm.DES)
      expect(result.filePath).toBe(`des/${testFileId}.enc`)
      expect(result.encryptionTime).toBeGreaterThan(0)
      expect(result.ciphertext).toBeInstanceOf(Buffer)
      expect(result.iv).toBeInstanceOf(Buffer)
    })

    it('should encrypt with RC4 algorithm', async () => {
      const result = await orchestrator.encryptWithAlgorithm(testFileBuffer, Algorithm.RC4, testFileId)
      
      expect(result.algorithm).toBe(Algorithm.RC4)
      expect(result.filePath).toBe(`rc4/${testFileId}.enc`)
      expect(result.encryptionTime).toBeGreaterThan(0)
      expect(result.ciphertext).toBeInstanceOf(Buffer)
      expect(result.iv).toBeUndefined() // RC4 doesn't use IV
    })

    it('should throw error for unsupported algorithm', async () => {
      await expect(orchestrator.encryptWithAlgorithm(testFileBuffer, 'INVALID' as Algorithm, testFileId))
        .rejects.toThrow('Unsupported algorithm: INVALID')
    })
  })

  describe('measureEncryptionPerformance', () => {
    it('should measure performance for all algorithms', async () => {
      const result = await orchestrator.measureEncryptionPerformance(testFileBuffer)
      
      expect(result).toHaveProperty('aes')
      expect(result).toHaveProperty('des')
      expect(result).toHaveProperty('rc4')
      
      expect(result.aes.encryptionTime).toBeGreaterThan(0)
      expect(result.des.encryptionTime).toBeGreaterThan(0)
      expect(result.rc4.encryptionTime).toBeGreaterThan(0)
      
      expect(result.aes.ciphertextSize).toBeGreaterThan(0)
      expect(result.des.ciphertextSize).toBeGreaterThan(0)
      expect(result.rc4.ciphertextSize).toBeGreaterThan(0)
    })

    it('should handle different file sizes', async () => {
      const smallFile = Buffer.from('small')
      const largeFile = Buffer.alloc(1000, 'a')
      
      const smallResult = await orchestrator.measureEncryptionPerformance(smallFile)
      const largeResult = await orchestrator.measureEncryptionPerformance(largeFile)
      
      // Larger files should generally take more time and produce larger ciphertext
      expect(largeResult.aes.ciphertextSize).toBeGreaterThan(smallResult.aes.ciphertextSize)
      expect(largeResult.des.ciphertextSize).toBeGreaterThan(smallResult.des.ciphertextSize)
      expect(largeResult.rc4.ciphertextSize).toBeGreaterThan(smallResult.rc4.ciphertextSize)
    })
  })

  describe('getFilePath', () => {
    it('should return correct file paths for each algorithm', () => {
      expect(orchestrator.getFilePath(Algorithm.AES, testFileId)).toBe(`aes/${testFileId}.enc`)
      expect(orchestrator.getFilePath(Algorithm.DES, testFileId)).toBe(`des/${testFileId}.enc`)
      expect(orchestrator.getFilePath(Algorithm.RC4, testFileId)).toBe(`rc4/${testFileId}.enc`)
    })
  })

  describe('checkFilesExist', () => {
    it('should check existence of all encrypted files', async () => {
      // Mock some files exist, some don't
      mockFs.access
        .mockResolvedValueOnce(undefined) // AES exists
        .mockRejectedValueOnce(new Error('Not found')) // DES doesn't exist
        .mockResolvedValueOnce(undefined) // RC4 exists
      
      const result = await orchestrator.checkFilesExist(testFileId)
      
      expect(result.aes).toBe(true)
      expect(result.des).toBe(false)
      expect(result.rc4).toBe(true)
    })
  })

  describe('deleteFiles', () => {
    it('should attempt to delete all encrypted files', async () => {
      await orchestrator.deleteFiles(testFileId)
      
      expect(mockFs.unlink).toHaveBeenCalledTimes(3)
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(testUploadDir, 'aes', `${testFileId}.enc`))
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(testUploadDir, 'des', `${testFileId}.enc`))
      expect(mockFs.unlink).toHaveBeenCalledWith(path.join(testUploadDir, 'rc4', `${testFileId}.enc`))
    })

    it('should handle deletion errors gracefully', async () => {
      mockFs.unlink.mockRejectedValue(new Error('File not found'))
      
      // Should not throw error even if files don't exist
      await expect(orchestrator.deleteFiles(testFileId)).resolves.toBeUndefined()
    })
  })
})
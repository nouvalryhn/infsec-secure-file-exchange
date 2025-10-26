import { AESEncryptor, DESEncryptor, RC4Encryptor, KeyManager } from '@/lib/encryption';
import { Algorithm, DataType, EncryptionResult } from '@/types/encryption';
import fs from 'fs/promises';
import path from 'path';

/**
 * File Encryption Orchestrator
 * Manages the parallel encryption of files using multiple algorithms
 */
export class FileEncryptionOrchestrator {
  public readonly aesEncryptor: AESEncryptor;
  public readonly desEncryptor: DESEncryptor;
  public readonly rc4Encryptor: RC4Encryptor;
  private baseUploadDir: string;

  constructor(baseUploadDir?: string) {
    this.aesEncryptor = new AESEncryptor();
    this.desEncryptor = new DESEncryptor();
    this.rc4Encryptor = new RC4Encryptor();
    this.baseUploadDir = baseUploadDir || path.join(process.cwd(), 'uploads');
  }

  /**
   * Ensures all required upload directories exist
   */
  async ensureDirectories(): Promise<void> {
    const dirs = ['aes', 'des', 'rc4'];
    
    for (const dir of dirs) {
      const fullPath = path.join(this.baseUploadDir, dir);
      try {
        await fs.access(fullPath);
      } catch {
        await fs.mkdir(fullPath, { recursive: true });
      }
    }
  }

  /**
   * Encrypts a file with all three algorithms in parallel using derived keys
   * @param fileBuffer - The file data to encrypt
   * @param fileId - Unique identifier for the file
   * @param sessionKey - Session key for deriving file-specific keys
   * @returns Promise resolving to encryption results for all algorithms
   */
  async encryptFileWithDerivedKeys(fileBuffer: Buffer, fileId: string, sessionKey: Buffer): Promise<{
    aes: EncryptionResult & { filePath: string };
    des: EncryptionResult & { filePath: string };
    rc4: EncryptionResult & { filePath: string };
  }> {
    // Ensure directories exist
    await this.ensureDirectories();

    // Derive keys for each algorithm from session key
    const aesKey = KeyManager.deriveFileKey(sessionKey, fileId, Algorithm.AES);
    const desKey = KeyManager.deriveFileKey(sessionKey, fileId, Algorithm.DES);
    const rc4Key = KeyManager.deriveFileKey(sessionKey, fileId, Algorithm.RC4);

    return this.encryptFileWithKeys(fileBuffer, fileId, aesKey, desKey, rc4Key);
  }

  /**
   * Encrypts a file with all three algorithms in parallel
   * @param fileBuffer - The file data to encrypt
   * @param fileId - Unique identifier for the file
   * @returns Promise resolving to encryption results for all algorithms
   */
  async encryptFile(fileBuffer: Buffer, fileId: string): Promise<{
    aes: EncryptionResult & { filePath: string };
    des: EncryptionResult & { filePath: string };
    rc4: EncryptionResult & { filePath: string };
  }> {
    // Ensure directories exist
    await this.ensureDirectories();

    // Generate random keys for each algorithm
    const aesKey = KeyManager.generateKey(Algorithm.AES);
    const desKey = KeyManager.generateKey(Algorithm.DES);
    const rc4Key = KeyManager.generateKey(Algorithm.RC4);

    return this.encryptFileWithKeys(fileBuffer, fileId, aesKey, desKey, rc4Key);
  }

  /**
   * Internal method to encrypt file with provided keys
   * @param fileBuffer - The file data to encrypt
   * @param fileId - Unique identifier for the file
   * @param aesKey - AES encryption key
   * @param desKey - DES encryption key
   * @param rc4Key - RC4 encryption key
   * @returns Promise resolving to encryption results for all algorithms
   */
  private async encryptFileWithKeys(
    fileBuffer: Buffer, 
    fileId: string, 
    aesKey: Buffer, 
    desKey: Buffer, 
    rc4Key: Buffer
  ): Promise<{
    aes: EncryptionResult & { filePath: string };
    des: EncryptionResult & { filePath: string };
    rc4: EncryptionResult & { filePath: string };
  }> {

    // Encrypt with all algorithms in parallel
    const [aesResult, desResult, rc4Result] = await Promise.all([
      this.aesEncryptor.encrypt(fileBuffer, aesKey),
      this.desEncryptor.encrypt(fileBuffer, desKey),
      this.rc4Encryptor.encrypt(fileBuffer, rc4Key)
    ]);

    // Define file paths
    const aesPath = path.join(this.baseUploadDir, 'aes', `${fileId}.enc`);
    const desPath = path.join(this.baseUploadDir, 'des', `${fileId}.enc`);
    const rc4Path = path.join(this.baseUploadDir, 'rc4', `${fileId}.enc`);

    // Prepare data for storage (prepend IV for block ciphers)
    const aesDataToStore = aesResult.iv ? Buffer.concat([aesResult.iv, aesResult.ciphertext]) : aesResult.ciphertext;
    const desDataToStore = desResult.iv ? Buffer.concat([desResult.iv, desResult.ciphertext]) : desResult.ciphertext;
    const rc4DataToStore = rc4Result.ciphertext; // RC4 doesn't use IV

    // Save encrypted files to disk in parallel
    await Promise.all([
      fs.writeFile(aesPath, aesDataToStore),
      fs.writeFile(desPath, desDataToStore),
      fs.writeFile(rc4Path, rc4DataToStore)
    ]);

    // Return results with file paths
    return {
      aes: {
        ...aesResult,
        filePath: `aes/${fileId}.enc`
      },
      des: {
        ...desResult,
        filePath: `des/${fileId}.enc`
      },
      rc4: {
        ...rc4Result,
        filePath: `rc4/${fileId}.enc`
      }
    };
  }

  /**
   * Encrypts file data with a specific algorithm
   * @param fileBuffer - The file data to encrypt
   * @param algorithm - The encryption algorithm to use
   * @param fileId - Unique identifier for the file
   * @returns Promise resolving to encryption result with file path
   */
  async encryptWithAlgorithm(
    fileBuffer: Buffer, 
    algorithm: Algorithm, 
    fileId: string
  ): Promise<EncryptionResult & { filePath: string }> {
    await this.ensureDirectories();

    let encryptor;
    let key: Buffer;
    let dirName: string;

    switch (algorithm) {
      case Algorithm.AES:
        encryptor = this.aesEncryptor;
        key = KeyManager.generateKey(Algorithm.AES);
        dirName = 'aes';
        break;
      case Algorithm.DES:
        encryptor = this.desEncryptor;
        key = KeyManager.generateKey(Algorithm.DES);
        dirName = 'des';
        break;
      case Algorithm.RC4:
        encryptor = this.rc4Encryptor;
        key = KeyManager.generateKey(Algorithm.RC4);
        dirName = 'rc4';
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    // Encrypt the file
    const result = await encryptor.encrypt(fileBuffer, key);

    // Prepare data for storage (prepend IV for block ciphers)
    const dataToStore = result.iv ? Buffer.concat([result.iv, result.ciphertext]) : result.ciphertext;

    // Save to disk
    const filePath = path.join(this.baseUploadDir, dirName, `${fileId}.enc`);
    await fs.writeFile(filePath, dataToStore);

    return {
      ...result,
      filePath: `${dirName}/${fileId}.enc`
    };
  }

  /**
   * Measures encryption performance for all algorithms
   * @param fileBuffer - The file data to encrypt
   * @returns Promise resolving to performance metrics for all algorithms
   */
  async measureEncryptionPerformance(fileBuffer: Buffer): Promise<{
    aes: { encryptionTime: number; ciphertextSize: number };
    des: { encryptionTime: number; ciphertextSize: number };
    rc4: { encryptionTime: number; ciphertextSize: number };
  }> {
    // Generate keys
    const aesKey = KeyManager.generateKey(Algorithm.AES);
    const desKey = KeyManager.generateKey(Algorithm.DES);
    const rc4Key = KeyManager.generateKey(Algorithm.RC4);

    // Measure encryption performance in parallel
    const [aesResult, desResult, rc4Result] = await Promise.all([
      this.aesEncryptor.encrypt(fileBuffer, aesKey),
      this.desEncryptor.encrypt(fileBuffer, desKey),
      this.rc4Encryptor.encrypt(fileBuffer, rc4Key)
    ]);

    return {
      aes: {
        encryptionTime: aesResult.encryptionTime,
        ciphertextSize: aesResult.ciphertextSize
      },
      des: {
        encryptionTime: desResult.encryptionTime,
        ciphertextSize: desResult.ciphertextSize
      },
      rc4: {
        encryptionTime: rc4Result.encryptionTime,
        ciphertextSize: rc4Result.ciphertextSize
      }
    };
  }

  /**
   * Decrypts a file using the specified algorithm
   * @param algorithm - The algorithm used for encryption
   * @param fileId - The file identifier
   * @param key - The decryption key
   * @returns Promise resolving to decryption result with timing
   */
  async decryptFile(
    algorithm: Algorithm, 
    fileId: string, 
    key: Buffer
  ): Promise<{ plaintext: Buffer; decryptionTime: number }> {
    let encryptor;
    let dirName: string;

    switch (algorithm) {
      case Algorithm.AES:
        encryptor = this.aesEncryptor;
        dirName = 'aes';
        break;
      case Algorithm.DES:
        encryptor = this.desEncryptor;
        dirName = 'des';
        break;
      case Algorithm.RC4:
        encryptor = this.rc4Encryptor;
        dirName = 'rc4';
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    // Read encrypted file
    const filePath = path.join(this.baseUploadDir, dirName, `${fileId}.enc`);
    const encryptedData = await fs.readFile(filePath);

    let ciphertext: Buffer;
    let iv: Buffer | undefined;

    // For block ciphers, extract IV from the beginning of the file
    if (algorithm === Algorithm.AES) {
      const ivSize = 16; // AES IV size
      iv = encryptedData.subarray(0, ivSize);
      ciphertext = encryptedData.subarray(ivSize);
    } else if (algorithm === Algorithm.DES) {
      const ivSize = 8; // DES IV size
      iv = encryptedData.subarray(0, ivSize);
      ciphertext = encryptedData.subarray(ivSize);
    } else {
      // RC4 doesn't use IV
      ciphertext = encryptedData;
    }

    // Decrypt the file
    const result = await encryptor.decrypt(ciphertext, key, iv);
    return {
      plaintext: result.plaintext,
      decryptionTime: result.decryptionTime
    };
  }

  /**
   * Gets the file path for a specific algorithm and file ID
   * @param algorithm - The encryption algorithm
   * @param fileId - The file identifier
   * @returns The relative file path
   */
  getFilePath(algorithm: Algorithm, fileId: string): string {
    const dirName = algorithm.toLowerCase();
    return `${dirName}/${fileId}.enc`;
  }

  /**
   * Checks if encrypted files exist for a given file ID
   * @param fileId - The file identifier
   * @returns Promise resolving to object indicating which files exist
   */
  async checkFilesExist(fileId: string): Promise<{
    aes: boolean;
    des: boolean;
    rc4: boolean;
  }> {
    const checks = await Promise.allSettled([
      fs.access(path.join(this.baseUploadDir, 'aes', `${fileId}.enc`)),
      fs.access(path.join(this.baseUploadDir, 'des', `${fileId}.enc`)),
      fs.access(path.join(this.baseUploadDir, 'rc4', `${fileId}.enc`))
    ]);

    return {
      aes: checks[0].status === 'fulfilled',
      des: checks[1].status === 'fulfilled',
      rc4: checks[2].status === 'fulfilled'
    };
  }

  /**
   * Deletes encrypted files for a given file ID
   * @param fileId - The file identifier
   * @returns Promise resolving when all files are deleted
   */
  async deleteFiles(fileId: string): Promise<void> {
    const filePaths = [
      path.join(this.baseUploadDir, 'aes', `${fileId}.enc`),
      path.join(this.baseUploadDir, 'des', `${fileId}.enc`),
      path.join(this.baseUploadDir, 'rc4', `${fileId}.enc`)
    ];

    await Promise.allSettled(
      filePaths.map(filePath => fs.unlink(filePath))
    );
  }
}
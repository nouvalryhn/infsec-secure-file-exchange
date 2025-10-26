'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Image, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Navigation } from '@/components/ui/navigation';
import { FileUpload, ProgressBar } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';
import { MultiStepProgress } from '@/components/ui/progress';

interface UploadedFile {
  file: File;
  preview?: string;
}

interface EncryptionMetrics {
  aes: {
    encryptionTime: number;
    ciphertextSize: number;
  };
  des: {
    encryptionTime: number;
    ciphertextSize: number;
  };
  rc4: {
    encryptionTime: number;
    ciphertextSize: number;
  };
}

interface UploadResponse {
  success: boolean;
  file: {
    id: string;
    originalName: string;
    fileType: string;
    uploadedAt: string;
    originalSize: number;
    mimeType: string;
  };
  encryptionMetrics: EncryptionMetrics;
  financialDataExtracted: number;
}

type StepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

interface UploadStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface UserSession {
  userId: string;
  username: string;
  isLoggedIn: boolean;
}

export default function UploadPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [user, setUser] = useState<UserSession | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | { code?: string; message: string } | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([
    { id: 'validate', label: 'Validating file', status: 'pending' },
    { id: 'upload', label: 'Uploading file', status: 'pending' },
    { id: 'encrypt', label: 'Encrypting with multiple algorithms', status: 'pending' },
    { id: 'store', label: 'Storing encrypted data', status: 'pending' },
    { id: 'complete', label: 'Upload complete', status: 'pending' }
  ]);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (response.ok && data.isLoggedIn && data.user) {
        setUser({
          userId: data.user.id,
          username: data.user.username,
          isLoggedIn: true
        });
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Session check error:', error);
      router.push('/login');
    }
  };

  const acceptedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload Excel files (.xlsx, .xls) or images (JPEG, PNG, GIF, WebP).';
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB.';
    }
    
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const uploadedFile: UploadedFile = { file };

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedFile.preview = e.target?.result as string;
        setSelectedFile({ ...uploadedFile });
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(uploadedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    setUploadResult(null);
  };

  const updateStepStatus = (stepId: string, status: StepStatus) => {
    setUploadSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Step 1: Validate
      updateStepStatus('validate', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus('validate', 'completed');
      setUploadProgress(20);

      // Step 2: Upload
      updateStepStatus('upload', 'in-progress');
      const formData = new FormData();
      formData.append('file', selectedFile.file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      updateStepStatus('upload', 'completed');
      setUploadProgress(40);

      // Step 3: Encrypt
      updateStepStatus('encrypt', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus('encrypt', 'completed');
      setUploadProgress(80);

      // Step 4: Store
      updateStepStatus('store', 'in-progress');
      const data = await response.json();
      
      if (response.ok) {
        updateStepStatus('store', 'completed');
        setUploadProgress(100);
        
        // Step 5: Complete
        updateStepStatus('complete', 'completed');
        setUploadResult(data);
        success('File uploaded successfully', `${selectedFile.file.name} has been encrypted and stored securely.`);
      } else {
        updateStepStatus('store', 'error');
        const errorMessage = data.error?.message || data.error || 'Upload failed. Please try again.';
        setError(errorMessage);
        showError('Upload failed', errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      showError('Network error', errorMessage);
      
      // Mark current step as error
      const currentStep = uploadSteps.find(step => step.status === 'in-progress');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1) return '<1ms';
    return `${ms.toFixed(2)}ms`;
  };

  if (uploadResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Upload Successful</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Your file has been encrypted and stored securely
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  File Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</p>
                  <p className="text-slate-900 dark:text-white">{uploadResult.file.originalName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</p>
                  <p className="text-slate-900 dark:text-white">{uploadResult.file.fileType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Size</p>
                  <p className="text-slate-900 dark:text-white">{formatFileSize(uploadResult.file.originalSize)}</p>
                </div>
                {uploadResult.financialDataExtracted > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Financial Fields</p>
                    <p className="text-slate-900 dark:text-white">{uploadResult.financialDataExtracted} fields extracted</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Encryption Performance</CardTitle>
                <CardDescription>
                  Comparison of encryption algorithms used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium text-slate-700 dark:text-slate-300">Algorithm</div>
                    <div className="font-medium text-slate-700 dark:text-slate-300">Time</div>
                    <div className="font-medium text-slate-700 dark:text-slate-300">Size</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">AES-256</div>
                    <div>{formatTime(uploadResult.encryptionMetrics.aes.encryptionTime)}</div>
                    <div>{formatFileSize(uploadResult.encryptionMetrics.aes.ciphertextSize)}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">DES</div>
                    <div>{formatTime(uploadResult.encryptionMetrics.des.encryptionTime)}</div>
                    <div>{formatFileSize(uploadResult.encryptionMetrics.des.ciphertextSize)}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">RC4</div>
                    <div>{formatTime(uploadResult.encryptionMetrics.rc4.encryptionTime)}</div>
                    <div>{formatFileSize(uploadResult.encryptionMetrics.rc4.ciphertextSize)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex gap-4">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => {
              setUploadResult(null);
              setSelectedFile(null);
              setUploadProgress(0);
            }}>
              Upload Another File
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation user={user} currentPath="/upload" />
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Upload File</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Upload Excel files or images to encrypt and store securely
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Select File</CardTitle>
            <CardDescription>
              Supported formats: Excel (.xlsx, .xls) and Images (JPEG, PNG, GIF, WebP)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {typeof error === 'string' ? error : error?.message || 'An error occurred'}
                </AlertDescription>
              </Alert>
            )}

            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Drop your file here, or click to browse
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Maximum file size: 10MB
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-input"
                />
                <Button asChild>
                  <label htmlFor="file-input" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {selectedFile.preview ? (
                      <img
                        src={selectedFile.preview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {selectedFile.file.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatFileSize(selectedFile.file.size)} • {selectedFile.file.type}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {isUploading && (
                  <div className="mt-4 space-y-4">
                    <ProgressBar 
                      value={uploadProgress} 
                      showLabel={true}
                      color={error ? 'red' : uploadProgress === 100 ? 'green' : 'blue'}
                    />
                    <MultiStepProgress steps={uploadSteps} />
                  </div>
                )}

                {!isUploading && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={uploadFile} className="flex-1">
                      Upload & Encrypt
                    </Button>
                    <Button variant="outline" onClick={removeFile}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
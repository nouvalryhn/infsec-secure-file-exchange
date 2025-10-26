'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Share2, 
  User, 
  Calendar, 
  FileText, 
  Image, 
  HardDrive,
  Clock,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileData {
  id: string;
  originalName: string;
  fileType: 'EXCEL' | 'IMAGE';
  uploadedAt: string;
  originalSize: number;
  mimeType: string;
  hasFinancialReport: boolean;
  sharedWith: Array<{
    shareId: string;
    userId: string;
    username: string;
    sharedAt: string;
  }>;
  encryptionMetrics: {
    aes?: {
      encryptionTime: number;
      ciphertextSize: number;
    };
    des?: {
      encryptionTime: number;
      ciphertextSize: number;
    };
    rc4?: {
      encryptionTime: number;
      ciphertextSize: number;
    };
  };
}

interface ShareFormData {
  recipientUsername: string;
}

interface ShareFormErrors {
  recipientUsername?: string;
  general?: string;
}

export default function FileSharePage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;
  
  const [file, setFile] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<ShareFormData>({ recipientUsername: '' });
  const [formErrors, setFormErrors] = useState<ShareFormErrors>({});
  const [isSharing, setIsSharing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (fileId) {
      loadFileDetails();
    }
  }, [fileId]);

  const loadFileDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/files');
      const data = await response.json();
      
      if (response.ok) {
        const ownedFile = data.files.owned.find((f: FileData) => f.id === fileId);
        if (ownedFile) {
          // Transform the data to match our interface
          const transformedFile: FileData = {
            ...ownedFile,
            sharedWith: ownedFile.sharedWith?.map((share: any) => ({
              shareId: share.shareId || `${fileId}-${share.userId}`, // Fallback if shareId not provided
              userId: share.userId,
              username: share.username,
              sharedAt: share.sharedAt
            })) || []
          };
          setFile(transformedFile);
        } else {
          setError('File not found or you do not have permission to share this file.');
        }
      } else {
        if (response.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load file details');
        }
      }
    } catch (error) {
      console.error('Load file error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ShareFormErrors = {};

    if (!formData.recipientUsername.trim()) {
      newErrors.recipientUsername = 'Username is required';
    } else if (formData.recipientUsername.trim().length < 3) {
      newErrors.recipientUsername = 'Username must be at least 3 characters';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name as keyof ShareFormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSharing(true);
    setFormErrors({});

    try {
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
          recipientUsername: formData.recipientUsername.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`File successfully shared with ${formData.recipientUsername}`);
        setFormData({ recipientUsername: '' });
        // Reload file details to update the shared list
        await loadFileDetails();
      } else {
        // Handle API errors
        if (data.error) {
          switch (data.error.code) {
            case 'USER_NOT_FOUND':
              setFormErrors({ recipientUsername: 'Username does not exist' });
              break;
            case 'ALREADY_SHARED':
              setFormErrors({ general: 'File is already shared with this user' });
              break;
            case 'INVALID_RECIPIENT':
              setFormErrors({ general: 'Cannot share file with yourself' });
              break;
            case 'FILE_NOT_FOUND':
              setFormErrors({ general: 'File not found or you do not own this file' });
              break;
            default:
              setFormErrors({ general: data.error.message || 'Sharing failed' });
          }
        } else {
          setFormErrors({ general: 'Sharing failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      setFormErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async (shareId: string, username: string) => {
    try {
      const response = await fetch(`/api/shares/${shareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage(`Access revoked from ${username}`);
        // Reload file details to update the shared list
        await loadFileDetails();
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Revoke share error:', error);
      setError('Network error. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (ms: number): string => {
    if (ms < 1) return '<1ms';
    return `${ms.toFixed(2)}ms`;
  };

  const getFileIcon = (fileType: string) => {
    return fileType === 'EXCEL' ? FileText : Image;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading file details...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                File Not Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error || 'The file you are looking for does not exist or you do not have permission to access it.'}
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const FileIcon = getFileIcon(file.fileType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Share File</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage sharing permissions for your encrypted file
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* File Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileIcon className="w-5 h-5" />
                File Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</p>
                <p className="text-slate-900 dark:text-white font-medium">{file.originalName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</p>
                  <p className="text-slate-900 dark:text-white">{file.fileType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Size</p>
                  <p className="text-slate-900 dark:text-white">{formatFileSize(file.originalSize)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Uploaded</p>
                <p className="text-slate-900 dark:text-white">{formatDate(file.uploadedAt)}</p>
              </div>

              {file.hasFinancialReport && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    ✓ Contains financial report data
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Encryption Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Encryption Performance</CardTitle>
              <CardDescription>
                Performance metrics for each encryption algorithm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div>Algorithm</div>
                  <div>Time</div>
                  <div>Size</div>
                </div>
                
                {file.encryptionMetrics.aes && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">AES-256</div>
                    <div>{formatTime(file.encryptionMetrics.aes.encryptionTime)}</div>
                    <div>{formatFileSize(file.encryptionMetrics.aes.ciphertextSize)}</div>
                  </div>
                )}
                
                {file.encryptionMetrics.des && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">DES</div>
                    <div>{formatTime(file.encryptionMetrics.des.encryptionTime)}</div>
                    <div>{formatFileSize(file.encryptionMetrics.des.ciphertextSize)}</div>
                  </div>
                )}
                
                {file.encryptionMetrics.rc4 && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">RC4</div>
                    <div>{formatTime(file.encryptionMetrics.rc4.encryptionTime)}</div>
                    <div>{formatFileSize(file.encryptionMetrics.rc4.ciphertextSize)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share with New User */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Share with User
            </CardTitle>
            <CardDescription>
              Enter a username to share this file with another user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleShare} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientUsername">Username</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="recipientUsername"
                      name="recipientUsername"
                      type="text"
                      value={formData.recipientUsername}
                      onChange={handleInputChange}
                      className={formErrors.recipientUsername ? 'border-red-500' : ''}
                      placeholder="Enter username to share with"
                      disabled={isSharing}
                    />
                    {formErrors.recipientUsername && (
                      <p className="text-sm text-red-600 mt-1">{formErrors.recipientUsername}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={isSharing}>
                    {isSharing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {formErrors.general && (
                <Alert variant="destructive">
                  <AlertDescription>{formErrors.general}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Current Shares */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Shared With ({file.sharedWith.length})
            </CardTitle>
            <CardDescription>
              Users who currently have access to this file
            </CardDescription>
          </CardHeader>
          <CardContent>
            {file.sharedWith.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  This file is not shared with anyone yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {file.sharedWith.map((share) => (
                  <div key={share.shareId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {share.username}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Shared {formatDate(share.sharedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeShare(share.shareId, share.username)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
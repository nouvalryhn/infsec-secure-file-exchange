'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  HardDrive, 
  Users, 
  Plus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Navigation } from '@/components/ui/navigation';
import { FileGrid } from '@/components/ui/file-grid';
import { useToast } from '@/components/ui/toast';

interface FileData {
  id: string;
  originalName: string;
  fileType: 'EXCEL' | 'IMAGE';
  uploadedAt: string;
  originalSize: number;
  mimeType: string;
  isOwner: boolean;
  owner?: {
    id: string;
    username: string;
  };
  hasFinancialReport: boolean;
  sharedWith?: Array<{
    userId: string;
    username: string;
    sharedAt: string;
  }>;
  sharedAt?: string;
  encryptionMetrics: {
    aes?: {
      encryptionTime: number;
      decryptionTime?: number;
      ciphertextSize: number;
      dataType: string;
    };
    des?: {
      encryptionTime: number;
      decryptionTime?: number;
      ciphertextSize: number;
      dataType: string;
    };
    rc4?: {
      encryptionTime: number;
      decryptionTime?: number;
      ciphertextSize: number;
      dataType: string;
    };
  };
}

interface FilesResponse {
  success: boolean;
  files: {
    owned: FileData[];
    shared: FileData[];
  };
}

interface UserSession {
  userId: string;
  username: string;
  isLoggedIn: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [files, setFiles] = useState<{ owned: FileData[]; shared: FileData[] }>({ owned: [], shared: [] });
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | { code?: string; message: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'owned' | 'shared'>('owned');

  useEffect(() => {
    checkSession();
    loadFiles();
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

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/files');
      const data: FilesResponse = await response.json();
      
      if (response.ok) {
        setFiles(data.files);
      } else {
        if (response.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load files');
        }
      }
    } catch (error) {
      console.error('Load files error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const handleDownload = async (fileId: string, algorithm: 'aes' | 'des' | 'rc4', fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download/${algorithm}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || errorData.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Download failed. Please try again.');
    }
  };

  const handleViewReport = (fileId: string) => {
    router.push(`/files/${fileId}/report`);
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload files to update the list
        await loadFiles();
        // Show success toast
        success('File deleted successfully', `"${fileName}" has been permanently deleted.`);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.error || 'Failed to delete file';
        setError(errorMessage);
        showError('Delete failed', errorMessage);
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      showError('Delete failed', errorMessage);
    }
  };



  const currentFiles = selectedTab === 'owned' ? files.owned : files.shared;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation user={user} currentPath="/dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {typeof error === 'string' ? error : error?.message || 'An error occurred'}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">My Files</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{files.owned.length}</p>
                </div>
                <HardDrive className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Shared with Me</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{files.shared.length}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Files</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {files.owned.length + files.shared.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('owned')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'owned'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                My Files ({files.owned.length})
              </button>
              <button
                onClick={() => setSelectedTab('shared')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'shared'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Shared with Me ({files.shared.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Files List */}
        <FileGrid
          files={currentFiles}
          onDownload={handleDownload}
          onViewReport={handleViewReport}
          onShare={(fileId) => router.push(`/files/${fileId}/share`)}
          onDelete={selectedTab === 'owned' ? handleDelete : undefined}
          emptyState={{
            title: selectedTab === 'owned' ? 'No files uploaded yet' : 'No files shared with you',
            description: selectedTab === 'owned' 
              ? 'Upload your first file to get started with secure encryption.'
              : 'Files shared with you by other users will appear here.',
            action: selectedTab === 'owned' ? {
              label: 'Upload Your First File',
              onClick: () => router.push('/upload')
            } : undefined
          }}
        />
      </div>
    </div>
  );
}
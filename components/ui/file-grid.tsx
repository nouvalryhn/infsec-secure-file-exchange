'use client';

import { useState } from 'react';
import { 
  FileText, 
  Image, 
  Download, 
  Share2, 
  Calendar, 
  HardDrive, 
  Eye,
  MoreVertical,
  User,
  Grid3X3,
  List,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/loading';

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
}

interface FileGridProps {
  files: FileData[];
  isLoading?: boolean;
  onDownload: (fileId: string, algorithm: 'aes' | 'des' | 'rc4', fileName: string) => void;
  onViewReport: (fileId: string) => void;
  onShare: (fileId: string) => void;
  onDelete?: (fileId: string, fileName: string) => void;
  emptyState?: {
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

type ViewMode = 'grid' | 'list';

export function FileGrid({ 
  files, 
  isLoading = false, 
  onDownload, 
  onViewReport, 
  onShare,
  onDelete,
  emptyState 
}: FileGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  const getFileIcon = (fileType: string) => {
    return fileType === 'EXCEL' ? FileText : Image;
  };

  const FileIconOrThumbnail = ({ file, size = 'w-5 h-5' }: { file: FileData; size?: string }) => {
    if (file.fileType === 'IMAGE') {
      return (
        <div className={`${size} rounded overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
          <img
            src={`/api/files/${file.id}/thumbnail`}
            alt={file.originalName}
            className={`${size} object-cover`}
            onError={(e) => {
              // Fallback to icon if thumbnail fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <Image className={`${size} text-slate-600 dark:text-slate-400 hidden`} />
        </div>
      );
    }
    
    const FileIcon = getFileIcon(file.fileType);
    return <FileIcon className={`${size} text-slate-600 dark:text-slate-400`} />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
          : 'space-y-4'
        }>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0 && emptyState) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {emptyState.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {emptyState.description}
          </p>
          {emptyState.action && (
            <Button onClick={emptyState.action.onClick}>
              {emptyState.action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Files Display */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
          : 'space-y-4'
      }>
        {files.map((file) => {
          const FileIcon = getFileIcon(file.fileType);
          
          if (viewMode === 'grid') {
            return (
              <Card key={file.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-3">
                    {/* File Icon/Thumbnail and Type */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                        <FileIconOrThumbnail file={file} size="w-10 h-10" />
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                        {file.fileType.toLowerCase()}
                      </span>
                    </div>

                    {/* File Name */}
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white truncate text-sm">
                        {file.originalName}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {formatFileSize(file.originalSize)}
                      </p>
                    </div>

                    {/* File Info */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(file.uploadedAt)}
                      </div>
                      {!file.isOwner && file.owner && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          by {file.owner.username}
                        </div>
                      )}
                      {file.isOwner && file.sharedWith && file.sharedWith.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Shared with {file.sharedWith.length}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      {file.hasFinancialReport && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewReport(file.id)}
                          className="w-full text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Report
                        </Button>
                      )}
                      
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(file.id, 'aes', file.originalName)}
                          className="text-xs px-2"
                          title="Download AES encrypted version"
                        >
                          AES
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(file.id, 'des', file.originalName)}
                          className="text-xs px-2"
                          title="Download DES encrypted version"
                        >
                          DES
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(file.id, 'rc4', file.originalName)}
                          className="text-xs px-2"
                          title="Download RC4 encrypted version"
                        >
                          RC4
                        </Button>
                      </div>
                      
                      {file.isOwner && (
                        <div className="grid grid-cols-2 gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onShare(file.id)}
                            className="text-xs"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                          {onDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(file.id, file.originalName)}
                              className="text-xs"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // List view
          return (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                        <FileIconOrThumbnail file={file} size="w-10 h-10" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white truncate">
                        {file.originalName}
                      </h3>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(file.uploadedAt)}
                        </span>
                        <span>{formatFileSize(file.originalSize)}</span>
                        <span className="capitalize">{file.fileType.toLowerCase()}</span>
                        {!file.isOwner && file.owner && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            by {file.owner.username}
                          </span>
                        )}
                      </div>
                      
                      {file.isOwner && file.sharedWith && file.sharedWith.length > 0 && (
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Share2 className="w-4 h-4" />
                            Shared with {file.sharedWith.length} user{file.sharedWith.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {file.hasFinancialReport && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewReport(file.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Report
                      </Button>
                    )}
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(file.id, 'aes', file.originalName)}
                        title="Download AES encrypted version"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        AES
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(file.id, 'des', file.originalName)}
                        title="Download DES encrypted version"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        DES
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(file.id, 'rc4', file.originalName)}
                        title="Download RC4 encrypted version"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        RC4
                      </Button>
                    </div>
                    
                    {file.isOwner && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onShare(file.id)}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                        {onDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(file.id, file.originalName)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
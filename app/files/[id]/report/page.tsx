'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Clock, 
  Shield, 
  User,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReportData {
  [fieldName: string]: {
    AES?: {
      value: any;
      decryptionTime: number;
      error?: string;
    };
    DES?: {
      value: any;
      decryptionTime: number;
      error?: string;
    };
    RC4?: {
      value: any;
      decryptionTime: number;
      error?: string;
    };
  };
}

interface ReportMetrics {
  totalFields: number;
  algorithmsUsed: string[];
  averageDecryptionTimes: {
    AES: number;
    DES: number;
    RC4: number;
  };
  totalDecryptionOperations: {
    AES: number;
    DES: number;
    RC4: number;
  };
}

interface ReportInfo {
  id: string;
  fileId: string;
  fileName: string;
  uploadedAt: string;
  createdAt: string;
  owner: {
    username: string;
  };
  isOwner: boolean;
}

interface ReportResponse {
  success: boolean;
  report: ReportInfo;
  data: ReportData;
  metrics: ReportMetrics;
}

type Algorithm = 'AES' | 'DES' | 'RC4';

export default function FinancialReportPage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;
  
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('AES');
  const [copiedField, setCopiedField] = useState<string>('');

  useEffect(() => {
    if (fileId) {
      loadReportData();
    }
  }, [fileId]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/files/${fileId}/report`);
      const data: ReportResponse = await response.json();
      
      if (response.ok) {
        setReportData(data);
      } else {
        if (response.status === 401) {
          router.push('/login');
        } else if (response.status === 404) {
          setError('Financial report not found for this file.');
        } else {
          setError('Failed to load financial report');
        }
      }
    } catch (error) {
      console.error('Load report error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      // Format numbers with appropriate decimal places and commas
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    }
    return String(value);
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = ['Field Name', 'AES Value', 'AES Time (ms)', 'DES Value', 'DES Time (ms)', 'RC4 Value', 'RC4 Time (ms)'];
    const rows = Object.entries(reportData.data).map(([fieldName, algorithms]) => [
      fieldName,
      algorithms.AES ? formatValue(algorithms.AES.value) : 'N/A',
      algorithms.AES ? formatTime(algorithms.AES.decryptionTime) : 'N/A',
      algorithms.DES ? formatValue(algorithms.DES.value) : 'N/A',
      algorithms.DES ? formatTime(algorithms.DES.decryptionTime) : 'N/A',
      algorithms.RC4 ? formatValue(algorithms.RC4.value) : 'N/A',
      algorithms.RC4 ? formatTime(algorithms.RC4.decryptionTime) : 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.report.fileName}_financial_report.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading financial report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Report Not Available
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error || 'The financial report you are looking for is not available.'}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
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
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Report</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Decrypted financial data from {reportData.report.fileName}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => router.push(`/files/${fileId}/share`)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Share File
              </Button>
            </div>
          </div>
        </div>

        {/* Report Info */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Fields</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {reportData.metrics.totalFields}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Owner</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {reportData.report.owner.username}
                    {reportData.report.isOwner && ' (You)'}
                  </p>
                </div>
                <User className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(reportData.report.createdAt)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Algorithm Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Decryption Algorithm
            </CardTitle>
            <CardDescription>
              Select which encryption algorithm's decrypted values to display
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['AES', 'DES', 'RC4'] as Algorithm[]).map((algorithm) => (
                <Button
                  key={algorithm}
                  variant={selectedAlgorithm === algorithm ? 'default' : 'outline'}
                  onClick={() => setSelectedAlgorithm(algorithm)}
                  className="flex items-center gap-2"
                >
                  {algorithm}
                  <span className="text-xs">
                    ({formatTime(reportData.metrics.averageDecryptionTimes[algorithm])} avg)
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Decryption Performance
            </CardTitle>
            <CardDescription>
              Average decryption times for each algorithm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {(['AES', 'DES', 'RC4'] as Algorithm[]).map((algorithm) => (
                <div key={algorithm} className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatTime(reportData.metrics.averageDecryptionTimes[algorithm])}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {algorithm} Average
                  </div>
                  <div className="text-xs text-slate-500">
                    {reportData.metrics.totalDecryptionOperations[algorithm]} operations
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Financial Data ({selectedAlgorithm} Decryption)
            </CardTitle>
            <CardDescription>
              Decrypted field values using {selectedAlgorithm} algorithm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      Field Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      Value
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      Decryption Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.data).map(([fieldName, algorithms]) => {
                    const algorithmData = algorithms[selectedAlgorithm];
                    const hasError = algorithmData?.error;
                    
                    return (
                      <tr key={fieldName} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {fieldName}
                        </td>
                        <td className="py-3 px-4">
                          {hasError ? (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">Decryption Error</span>
                            </div>
                          ) : (
                            <span className="text-slate-900 dark:text-white font-mono">
                              {formatValue(algorithmData?.value)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {algorithmData ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(algorithmData.decryptionTime)}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {!hasError && algorithmData && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(String(algorithmData.value), fieldName)}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              {copiedField === fieldName ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Algorithm Comparison */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Algorithm Comparison</CardTitle>
            <CardDescription>
              Compare decrypted values across all algorithms for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      Field
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      AES
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      DES
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      RC4
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.data).slice(0, 10).map(([fieldName, algorithms]) => (
                    <tr key={fieldName} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                        {fieldName}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {algorithms.AES?.error ? (
                          <span className="text-red-600 text-xs">Error</span>
                        ) : (
                          formatValue(algorithms.AES?.value)
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {algorithms.DES?.error ? (
                          <span className="text-red-600 text-xs">Error</span>
                        ) : (
                          formatValue(algorithms.DES?.value)
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {algorithms.RC4?.error ? (
                          <span className="text-red-600 text-xs">Error</span>
                        ) : (
                          formatValue(algorithms.RC4?.value)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Object.keys(reportData.data).length > 10 && (
                <div className="text-center py-4 text-sm text-slate-600 dark:text-slate-400">
                  Showing first 10 fields. Export CSV for complete data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
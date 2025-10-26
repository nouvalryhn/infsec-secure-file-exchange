'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Clock,
  HardDrive,
  Shield,
  TrendingUp,
  Filter,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

// Types for performance data
interface AlgorithmMetrics {
  algorithm: 'AES' | 'DES' | 'RC4';
  avgEncryptionTime: number;
  avgDecryptionTime: number;
  avgCiphertextSize: number;
  sampleCount: number;
}

interface DataTypeMetrics {
  dataType: 'NUMERICAL' | 'SPREADSHEET' | 'IMAGE';
  algorithm: 'AES' | 'DES' | 'RC4';
  avgEncryptionTime: number;
  avgDecryptionTime: number;
  avgCiphertextSize: number;
  sampleCount: number;
}

interface PerformanceData {
  algorithms: AlgorithmMetrics[];
  dataTypes: DataTypeMetrics[];
  summary: {
    totalSamples: number;
    lastUpdated: string;
    algorithmsCompared: number;
    dataTypesAnalyzed: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: PerformanceData;
}

export default function MetricsPage() {
  const router = useRouter();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDataType, setSelectedDataType] = useState<'ALL' | 'NUMERICAL' | 'SPREADSHEET' | 'IMAGE'>('ALL');
  const [selectedView, setSelectedView] = useState<'encryption' | 'decryption' | 'size'>('encryption');

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/metrics/performance');
      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        setPerformanceData(data.data);
      } else {
        if (response.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load performance metrics');
        }
      }
    } catch (error) {
      console.error('Load performance data error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data based on selected filters
  const getChartData = () => {
    if (!performanceData) return [];

    const filteredData = selectedDataType === 'ALL'
      ? performanceData.dataTypes
      : performanceData.dataTypes.filter(item => item.dataType === selectedDataType);

    // Group by algorithm for comparison
    const chartData = ['AES', 'DES', 'RC4'].map(algorithm => {
      const algorithmData = filteredData.filter(item => item.algorithm === algorithm);

      let value = 0;
      let sampleCount = 0;

      if (algorithmData.length > 0) {
        if (selectedView === 'encryption') {
          value = algorithmData.reduce((sum, item) => sum + item.avgEncryptionTime * item.sampleCount, 0) /
            algorithmData.reduce((sum, item) => sum + item.sampleCount, 0);
        } else if (selectedView === 'decryption') {
          value = algorithmData.reduce((sum, item) => sum + item.avgDecryptionTime * item.sampleCount, 0) /
            algorithmData.reduce((sum, item) => sum + item.sampleCount, 0);
        } else {
          value = algorithmData.reduce((sum, item) => sum + item.avgCiphertextSize * item.sampleCount, 0) /
            algorithmData.reduce((sum, item) => sum + item.sampleCount, 0);
        }
        sampleCount = algorithmData.reduce((sum, item) => sum + item.sampleCount, 0);
      }

      return {
        algorithm,
        value: Math.round(value * 100) / 100,
        sampleCount
      };
    });

    return chartData;
  };

  // Prepare comprehensive comparison data for all metrics
  const getComprehensiveChartData = () => {
    if (!performanceData) return [];

    const filteredData = selectedDataType === 'ALL'
      ? performanceData.dataTypes
      : performanceData.dataTypes.filter(item => item.dataType === selectedDataType);

    // Group by algorithm and include all metrics
    const chartData = ['AES', 'DES', 'RC4'].map(algorithm => {
      const algorithmData = filteredData.filter(item => item.algorithm === algorithm);

      let encryptionTime = 0;
      let decryptionTime = 0;
      let ciphertextSize = 0;
      let sampleCount = 0;

      if (algorithmData.length > 0) {
        const totalSamples = algorithmData.reduce((sum, item) => sum + item.sampleCount, 0);
        encryptionTime = algorithmData.reduce((sum, item) => sum + item.avgEncryptionTime * item.sampleCount, 0) / totalSamples;
        decryptionTime = algorithmData.reduce((sum, item) => sum + item.avgDecryptionTime * item.sampleCount, 0) / totalSamples;
        ciphertextSize = algorithmData.reduce((sum, item) => sum + item.avgCiphertextSize * item.sampleCount, 0) / totalSamples;
        sampleCount = totalSamples;
      }

      return {
        algorithm,
        encryptionTime: Math.round(encryptionTime * 100) / 100,
        decryptionTime: Math.round(decryptionTime * 100) / 100,
        ciphertextSize: Math.round(ciphertextSize),
        efficiencyRatio: ciphertextSize > 0 ? Math.round((encryptionTime / ciphertextSize) * 10000) / 10000 : 0,
        sampleCount
      };
    });

    return chartData;
  };

  // Prepare data type comparison data
  const getDataTypeComparisonData = () => {
    if (!performanceData) return [];

    const dataTypes = ['NUMERICAL', 'SPREADSHEET', 'IMAGE'];
    const algorithms = ['AES', 'DES', 'RC4'];

    return dataTypes.map(dataType => {
      const dataTypeData = performanceData.dataTypes.filter(item => item.dataType === dataType);

      const result: any = { dataType };

      algorithms.forEach(algorithm => {
        const algorithmData = dataTypeData.find(item => item.algorithm === algorithm);
        if (algorithmData) {
          if (selectedView === 'encryption') {
            result[algorithm] = Math.round(algorithmData.avgEncryptionTime * 100) / 100;
          } else if (selectedView === 'decryption') {
            result[algorithm] = Math.round(algorithmData.avgDecryptionTime * 100) / 100;
          } else {
            result[algorithm] = Math.round(algorithmData.avgCiphertextSize);
          }
        } else {
          result[algorithm] = 0;
        }
      });

      return result;
    });
  };

  // Get data type distribution for pie chart
  const getDataTypeDistribution = () => {
    if (!performanceData) return [];

    const distribution = performanceData.dataTypes.reduce((acc, item) => {
      if (!acc[item.dataType]) {
        acc[item.dataType] = 0;
      }
      acc[item.dataType] += item.sampleCount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([dataType, count]) => ({
      name: dataType,
      value: count
    }));
  };

  const formatTime = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getYAxisLabel = () => {
    switch (selectedView) {
      case 'encryption': return 'Encrypt time (ms)';
      case 'decryption': return 'Decrypt time (ms)';
      case 'size': return 'Ciphertext Size (bytes)';
      default: return '';
    }
  };

  const getChartTitle = () => {
    const viewTitle = selectedView === 'encryption' ? 'Encryption Time' :
      selectedView === 'decryption' ? 'Decryption Time' : 'Ciphertext Size';
    const dataTypeTitle = selectedDataType === 'ALL' ? 'All Data Types' : selectedDataType;
    return `${viewTitle} Comparison - ${dataTypeTitle}`;
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B']; // Blue, Green, Amber
  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']; // Blue, Green, Amber, Red

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Performance Metrics
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Encryption algorithm performance comparison
                </p>
              </div>
            </div>

            <Button onClick={loadPerformanceData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {performanceData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Samples</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {performanceData.summary.totalSamples}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Algorithms</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {performanceData.summary.algorithmsCompared}
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Data Types</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {performanceData.summary.dataTypesAnalyzed}
                      </p>
                    </div>
                    <HardDrive className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Updated</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {new Date(performanceData.summary.lastUpdated).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(performanceData.summary.lastUpdated).toLocaleTimeString()}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Data Type
                    </label>
                    <select
                      value={selectedDataType}
                      onChange={(e) => setSelectedDataType(e.target.value as any)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="ALL">All Data Types</option>
                      <option value="NUMERICAL">Numerical</option>
                      <option value="SPREADSHEET">Spreadsheet</option>
                      <option value="IMAGE">Image</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Metric
                    </label>
                    <select
                      value={selectedView}
                      onChange={(e) => setSelectedView(e.target.value as any)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="encryption">Encryption Time</option>
                      <option value="decryption">Decryption Time</option>
                      <option value="size">Ciphertext Size</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Comparison Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Primary Metric Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{getChartTitle()}</CardTitle>
                  <CardDescription>
                    Compare {selectedView === 'size' ? 'ciphertext sizes' : 'processing times'} across encryption algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="algorithm" />
                        <YAxis label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          formatter={(value: number) => [
                            selectedView === 'size' ? formatSize(value) : formatTime(value),
                            getYAxisLabel()
                          ]}
                          labelFormatter={(label) => `Algorithm: ${label}`}
                        />
                        <Legend />
                        <Bar
                          dataKey="value"
                          fill="#3B82F6"
                          name={getYAxisLabel()}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Data Type Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Data Type</CardTitle>
                  <CardDescription>
                    {selectedView === 'size' ? 'Ciphertext sizes' : 'Processing times'} grouped by data type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getDataTypeComparisonData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dataType" />
                        <YAxis label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          formatter={(value: number) => [
                            selectedView === 'size' ? formatSize(value) : formatTime(value),
                            'Value'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="AES" fill="#3B82F6" name="AES" />
                        <Bar dataKey="DES" fill="#10B981" name="DES" />
                        <Bar dataKey="RC4" fill="#F59E0B" name="RC4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Performance Chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Comprehensive Performance Comparison</CardTitle>
                <CardDescription>
                  All performance metrics displayed together for complete analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getComprehensiveChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="algorithm" />
                      <YAxis yAxisId="time" orientation="left" label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="size" orientation="right" label={{ value: 'Size (bytes)', angle: 90, position: 'insideRight' }} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === 'Ciphertext Size') {
                            return [formatSize(value), name];
                          }
                          return [formatTime(value), name];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="time" dataKey="encryptionTime" fill="#3B82F6" name="Encryption Time" />
                      <Bar yAxisId="time" dataKey="decryptionTime" fill="#10B981" name="Decryption Time" />
                      <Line yAxisId="size" type="monotone" dataKey="ciphertextSize" stroke="#F59E0B" strokeWidth={3} name="Ciphertext Size" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Data Type Distribution and Algorithm Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Data Type Distribution</CardTitle>
                  <CardDescription>
                    Distribution of samples across different data types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDataTypeDistribution()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getDataTypeDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Algorithm Performance Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Summary</CardTitle>
                  <CardDescription>
                    Overall performance metrics by algorithm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 font-medium text-slate-900 dark:text-white">Algorithm</th>
                          <th className="text-right py-2 font-medium text-slate-900 dark:text-white">Encrypt</th>
                          <th className="text-right py-2 font-medium text-slate-900 dark:text-white">Decrypt</th>
                          <th className="text-right py-2 font-medium text-slate-900 dark:text-white">Size</th>
                          <th className="text-right py-2 font-medium text-slate-900 dark:text-white">Samples</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceData.algorithms.map((algo) => (
                          <tr key={algo.algorithm} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 font-medium text-slate-900 dark:text-white">{algo.algorithm}</td>
                            <td className="text-right py-2 text-slate-600 dark:text-slate-400">
                              {formatTime(algo.avgEncryptionTime)}
                            </td>
                            <td className="text-right py-2 text-slate-600 dark:text-slate-400">
                              {formatTime(algo.avgDecryptionTime)}
                            </td>
                            <td className="text-right py-2 text-slate-600 dark:text-slate-400">
                              {formatSize(algo.avgCiphertextSize)}
                            </td>
                            <td className="text-right py-2 text-slate-600 dark:text-slate-400">
                              {algo.sampleCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Performance Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Encryption vs Decryption Time Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Encryption vs Decryption Time</CardTitle>
                  <CardDescription>
                    Compare processing times for encryption and decryption operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getComprehensiveChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="algorithm" />
                        <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => [formatTime(value), 'Time']} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="encryptionTime"
                          stackId="1"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.6}
                          name="Encryption Time"
                        />
                        <Area
                          type="monotone"
                          dataKey="decryptionTime"
                          stackId="1"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.6}
                          name="Decryption Time"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Efficiency Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Efficiency</CardTitle>
                  <CardDescription>
                    Efficiency ratio of encryption time to ciphertext size
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getComprehensiveChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="algorithm" />
                        <YAxis label={{ value: 'Efficiency Ratio', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === 'Efficiency Ratio') {
                              return [`${value.toFixed(4)} ms/byte`, name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="efficiencyRatio"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                          name="Efficiency Ratio"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Data Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Performance by Data Type</CardTitle>
                <CardDescription>
                  Performance metrics broken down by data type and algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 font-medium text-slate-900 dark:text-white">Data Type</th>
                        <th className="text-left py-2 font-medium text-slate-900 dark:text-white">Algorithm</th>
                        <th className="text-right py-2 font-medium text-slate-900 dark:text-white">Encrypt Time</th>
                        <th className="text-right py-2 font-medium text-slate-900 dark:text-white">Decrypt Time</th>
                        <th className="text-right py-2 font-medium text-slate-900 dark:text-white">Ciphertext Size</th>
                        <th className="text-right py-2 font-medium text-slate-900 dark:text-white">Samples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.dataTypes.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 font-medium text-slate-900 dark:text-white">{item.dataType}</td>
                          <td className="py-2 text-slate-600 dark:text-slate-400">{item.algorithm}</td>
                          <td className="text-right py-2 text-slate-600 dark:text-slate-400">
                            {formatTime(item.avgEncryptionTime)}
                          </td>
                          <td className="text-right py-2 text-slate-600 dark:text-slate-400">
                            {formatTime(item.avgDecryptionTime)}
                          </td>
                          <td className="text-right py-2 text-slate-600 dark:text-slate-400">
                            {formatSize(item.avgCiphertextSize)}
                          </td>
                          <td className="text-right py-2 text-slate-600 dark:text-slate-400">
                            {item.sampleCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
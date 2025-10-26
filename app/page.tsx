import Link from 'next/link';
import { Shield, Lock, Share2, BarChart3, Upload, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/ui/navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mx-auto mb-8">
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Secure File Exchange
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto">
            Upload, encrypt, and share confidential files with advanced symmetric encryption. 
            Compare AES, DES, and RC4 performance while maintaining enterprise-grade security.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register" className="flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Enterprise-Grade Security Features
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Built with modern cryptographic standards and designed for performance analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Multi-Algorithm Encryption</CardTitle>
                <CardDescription>
                  Encrypt files with AES-256, DES, and RC4 algorithms for comprehensive security analysis
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Share2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Secure File Sharing</CardTitle>
                <CardDescription>
                  Share encrypted files with authorized users while maintaining access control and audit trails
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Compare encryption performance, analyze processing times, and optimize for your use case
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle>Easy File Upload</CardTitle>
                <CardDescription>
                  Drag-and-drop interface with support for Excel spreadsheets and images up to 10MB
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Financial Data Protection</CardTitle>
                <CardDescription>
                  Specialized handling for financial reports with field-level encryption and secure storage
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Session-Based Security</CardTitle>
                <CardDescription>
                  Secure authentication with encrypted sessions and automatic key management
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Simple steps to secure your confidential files
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Upload Your Files
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Upload Excel spreadsheets or images through our secure interface with drag-and-drop support
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Automatic Encryption
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Files are automatically encrypted using AES, DES, and RC4 algorithms with performance tracking
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Share Securely
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Share encrypted files with authorized users and analyze encryption performance metrics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to Secure Your Files?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join thousands of users who trust our platform for secure file exchange and encryption analysis
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Secure File Exchange</h3>
          <p className="text-slate-400 mb-6">
            Enterprise-grade file encryption and sharing platform
          </p>
          <div className="flex justify-center gap-6 text-sm text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

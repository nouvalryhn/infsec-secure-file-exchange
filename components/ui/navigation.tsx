'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  User, 
  LogOut, 
  Plus, 
  BarChart3, 
  Menu, 
  X,
  Home,
  Upload,
  Settings,
  ChevronDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavigationProps {
  user?: {
    userId: string;
    username: string;
    isLoggedIn: boolean;
  } | null;
  currentPath?: string;
}

export function Navigation({ user, currentPath }: NavigationProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/metrics', label: 'Metrics', icon: BarChart3 },
  ];

  const isActive = (href: string) => currentPath === href;

  if (!user?.isLoggedIn) {
    return (
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Secure File Exchange
                </h1>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Secure File Exchange
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link href="/upload" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Upload
              </Link>
            </Button>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">{user.username}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <Card className="absolute right-0 top-full mt-2 w-48 z-20">
                    <CardContent className="p-2">
                      <div className="flex flex-col space-y-1">
                        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          Signed in as <br />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLogout}
                          className="justify-start"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    size="sm"
                    asChild
                    className="justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
                  <ThemeToggle />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/upload" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Upload File
                  </Link>
                </Button>
                
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-2">
                  Signed in as <span className="font-medium text-gray-900 dark:text-white">{user.username}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="justify-start w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();

  // Refresh user data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshUser]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}!</p>
          </div>

          <Separator className="my-6" />

          {/* User Information */}
          <div className="px-4 sm:px-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Your current session details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Current User ID:</h3>
                  <code className="bg-muted p-2 rounded block mt-1 text-sm">
                    {user?.id || 'Not logged in'}
                  </code>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Full Name:</h3>
                  <p className="mt-1">{user?.full_name || user?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email:</h3>
                  <p className="mt-1">{user?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Role:</h3>
                  <Badge variant="outline" className="mt-1">
                    {user?.role || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 
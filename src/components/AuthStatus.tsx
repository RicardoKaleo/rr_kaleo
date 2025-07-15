'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthStatus() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (user) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <p className="text-green-600 font-medium">
            ✅ Welcome back, {user.full_name}!
          </p>
          <Button asChild>
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center space-y-4 p-6">
        <p className="text-muted-foreground">
          Please sign in to access the platform
        </p>
        <div className="flex space-x-4">
          <Button asChild>
            <Link href="/auth/login">
              Sign In
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/register">
              Create Account
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
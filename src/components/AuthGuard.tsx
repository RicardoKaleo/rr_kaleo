'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: 'manager' | 'final_user'
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireRole,
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setTimedOut(true), 10000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(redirectTo)
      } else if (requireRole && user && user.role !== requireRole) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, requireAuth, requireRole, redirectTo, router])

  // Show loading while checking authentication
  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-80">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if loading took too long
  if (loading && timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-80">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-red-500 text-2xl mb-4">Error</div>
            <p className="text-muted-foreground">Authentication is taking too long. Please refresh the page or try again later.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Don't render children if user is not authenticated and auth is required
  if (requireAuth && !user) {
    return null
  }

  // Don't render children if user doesn't have required role
  if (requireRole && user && user.role !== requireRole) {
    return null
  }

  return <>{children}</>
} 
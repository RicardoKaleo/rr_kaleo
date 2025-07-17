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
  const { user, loading, authStatus } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authStatus === 'unauthenticated' && requireAuth) {
      router.push(redirectTo)
    } else if (authStatus === 'authenticated' && requireRole && user && user.role !== requireRole) {
      router.push('/dashboard')
    }
  }, [user, loading, requireAuth, requireRole, redirectTo, router, authStatus])

  // Only block rendering if unauthenticated or role mismatch
  if (authStatus === 'unauthenticated' && requireAuth) {
    return null
  }
  if (authStatus === 'authenticated' && requireRole && user && user.role !== requireRole) {
    return null
  }

  // Optimistically render children for 'unknown' or 'authenticated' status
  return <>{children}</>
} 
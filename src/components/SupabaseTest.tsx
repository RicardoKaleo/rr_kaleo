"use client"

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SupabaseTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const runTests = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      // Test 1: Check environment variables
      addResult('Testing environment variables...')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl) {
        addResult('❌ NEXT_PUBLIC_SUPABASE_URL is missing')
        return
      }
      if (!supabaseKey) {
        addResult('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
        return
      }
      addResult(`✅ Environment variables found - URL: ${supabaseUrl}`)

      // Test 2: Test direct fetch to Supabase
      addResult('Testing direct fetch to Supabase...')
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        if (response.ok) {
          addResult('✅ Direct fetch to Supabase successful')
        } else {
          addResult(`❌ Direct fetch failed with status: ${response.status}`)
        }
      } catch (error) {
        addResult(`❌ Direct fetch error: ${error}`)
      }

      // Test 3: Test Supabase client creation
      addResult('Testing Supabase client creation...')
      try {
        const supabase = createBrowserSupabaseClient()
        addResult('✅ Supabase client created successfully')
        
        // Test 4: Test auth endpoint
        addResult('Testing auth endpoint...')
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          addResult(`❌ Auth test failed: ${error.message}`)
        } else {
          addResult('✅ Auth endpoint working')
        }
        
      } catch (error) {
        addResult(`❌ Supabase client error: ${error}`)
      }

      // Test 5: Test CORS
      addResult('Testing CORS...')
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        })
        addResult(`✅ CORS test completed - Status: ${response.status}`)
      } catch (error) {
        addResult(`❌ CORS test failed: ${error}`)
      }

    } catch (error) {
      addResult(`❌ General error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      <Button onClick={runTests} disabled={loading} className="mb-4">
        {loading ? 'Running Tests...' : 'Run Connection Tests'}
      </Button>
      
      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
            {result}
          </div>
        ))}
      </div>
    </Card>
  )
} 
"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestConnectionPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (result: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testConnection = async () => {
    setLoading(true)
    setResults([])

    try {
      // Test 1: Environment variables
      addResult('Checking environment variables...')
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
      addResult(`✅ Environment variables found`)
      addResult(`URL: ${supabaseUrl}`)
      addResult(`Key: ${supabaseKey.substring(0, 20)}...`)

      // Test 2: Direct fetch test
      addResult('Testing direct fetch to Supabase...')
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          addResult('✅ Direct fetch successful')
        } else {
          addResult(`❌ Direct fetch failed: ${response.status} ${response.statusText}`)
        }
      } catch (error: any) {
        addResult(`❌ Direct fetch error: ${error.message}`)
      }

      // Test 3: Auth endpoint test
      addResult('Testing auth endpoint...')
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          addResult('✅ Auth endpoint accessible')
        } else {
          addResult(`❌ Auth endpoint failed: ${response.status} ${response.statusText}`)
        }
      } catch (error: any) {
        addResult(`❌ Auth endpoint error: ${error.message}`)
      }

      // Test 4: CORS test
      addResult('Testing CORS...')
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:3001',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'apikey,authorization,content-type'
          }
        })
        
        const corsHeaders = response.headers.get('access-control-allow-origin')
        addResult(`CORS headers: ${corsHeaders || 'None'}`)
        
        if (corsHeaders) {
          addResult('✅ CORS appears to be configured')
        } else {
          addResult('⚠️ CORS headers not found')
        }
      } catch (error: any) {
        addResult(`❌ CORS test error: ${error.message}`)
      }

    } catch (error: any) {
      addResult(`❌ General error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
        
        <Card className="p-6 mb-6">
          <Button onClick={testConnection} disabled={loading} className="mb-4">
            {loading ? 'Testing...' : 'Test Connection'}
          </Button>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {result}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Troubleshooting Steps</h2>
          <div className="space-y-2 text-sm">
            <p>1. Make sure Supabase is running: <code>supabase status</code></p>
            <p>2. Check if ports are available: <code>netstat -ano | findstr :54321</code></p>
            <p>3. Try restarting Docker Desktop</p>
            <p>4. Check Windows Defender Firewall settings</p>
            <p>5. Run PowerShell as Administrator</p>
          </div>
        </Card>
      </div>
    </div>
  )
} 
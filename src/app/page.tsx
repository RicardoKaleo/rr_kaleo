import SupabaseTest from '@/components/SupabaseTest'
import AuthStatus from '@/components/AuthStatus'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-2xl w-full flex flex-col items-center gap-8">
        <h1 className="text-5xl font-bold text-center mb-2 tracking-tight">
          Welcome to Reverse Recruiting SaaS
        </h1>
        <p className="text-lg text-center text-muted-foreground mb-4">
          A comprehensive platform for managing reverse recruiting clients and campaigns
        </p>
        <div className="w-full max-w-md">
          <SupabaseTest />
        </div>
        <div className="w-full flex flex-col items-center gap-4 mt-4">
          <AuthStatus />
        </div>
        <div className="flex gap-4 mt-6">
          <Button variant="default">Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </main>
  )
} 
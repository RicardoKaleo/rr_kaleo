"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "final_user" as "manager" | "final_user",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signUp, signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }
    try {
      const { user, error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role
      )
      if (error) {
        setError(error.message)
      } else {
        // Automatically sign in the user after registration
        const { data: signInData, error: signInError } = await signIn(
          formData.email,
          formData.password
        )
        if (signInError) {
          setError(signInError.message)
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md p-8 shadow-xl bg-card">
        <h2 className="text-2xl font-bold text-center mb-2">Create your account</h2>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Or {" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            sign in to your existing account
          </Link>
        </p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-background text-foreground"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="final_user">Final User</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Card>
    </main>
  )
} 
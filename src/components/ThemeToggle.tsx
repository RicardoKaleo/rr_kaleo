"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from '@/lib/utils'

const themes = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
]

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  // Determine the current theme (resolvedTheme for system)
  const current = theme === "system" ? resolvedTheme : theme

  return (
    <div className="flex items-center gap-2">
      <div className="flex bg-muted rounded-full px-1 py-1 shadow-inner">
        {themes.map(({ value, icon: Icon }) => (
          <button
            key={value}
            aria-label={value.charAt(0).toUpperCase() + value.slice(1) + ' theme'}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
              current === value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-muted-foreground"
            )}
            onClick={() => setTheme(value)}
            type="button"
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  )
} 
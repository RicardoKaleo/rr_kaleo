"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Users, Briefcase, Mail, Calendar, Activity, FileText, MessageCircle, Settings, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';

const navLinks = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Client Management', icon: Users, href: '/clients' },
  { label: 'Job Listings', icon: Briefcase, href: '/jobs' },
  { label: 'Messages', icon: Mail, href: '/messages' },
  { label: 'Calendar', icon: Calendar, href: '/calendar' },
  { label: 'Activity', icon: Activity, href: '/activity' },
  { label: 'Static', icon: FileText, href: '/static' },
];

const accountLinks = [
  { label: 'Chat', icon: MessageCircle, href: '/chat' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Log out', icon: LogOut, href: '/auth/logout' },
];

export function Sidebar({ collapsed, onCollapse }: { collapsed: boolean, onCollapse: () => void }) {
  return (
    <aside className={cn(
      'h-screen bg-background border-r flex flex-col transition-all duration-300',
      collapsed ? 'w-20' : 'w-64'
    )}>
      <div className="flex items-center justify-between p-4">
        <div className={cn('font-bold text-lg', collapsed && 'hidden')}>Softtech</div>
        <Button variant="ghost" size="icon" onClick={onCollapse} aria-label="Toggle sidebar">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      <nav className="flex-1 px-2 space-y-2">
        <div className="text-xs text-muted-foreground px-2 pt-2 pb-1 uppercase tracking-wide">
          Overview
        </div>
        {navLinks.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors',
            collapsed && 'justify-center'
          )}>
            <Icon className="h-5 w-5" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
        <div className="mt-6 text-xs text-muted-foreground px-2 pb-1 uppercase tracking-wide">
          Account
        </div>
        {accountLinks.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors',
            collapsed && 'justify-center'
          )}>
            <Icon className="h-5 w-5" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>
      <div className="p-4 mt-auto flex items-center justify-between">
        <div className={cn('flex items-center gap-2', collapsed && 'hidden')}>
          <span className="text-xs text-muted-foreground">Dark Mode</span>
        </div>
      </div>
    </aside>
  );
} 
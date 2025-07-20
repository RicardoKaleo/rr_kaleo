"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Users, Briefcase, FileText, Mail, LogOut, Menu, Settings } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const navLinks = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Clients', icon: Users, href: '/dashboard/clients' },
  { label: 'Job Listings', icon: Briefcase, href: '/dashboard/job-listings' },
  { label: 'Email Templates', icon: FileText, href: '/dashboard/email-templates' },
  { label: 'Email Campaigns', icon: Mail, href: '/dashboard/email-campaigns' },
  { label: 'Gmail Watch Test', icon: Settings, href: '/dashboard/gmail-integration/test-watches' },
];

export function Sidebar({ collapsed, onCollapse }: { collapsed: boolean, onCollapse: () => void }) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

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
          Navigation
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
      </nav>
      <div className="border-t">
        <div className="p-4 flex flex-col gap-4">
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            className={cn(
              'flex items-center gap-3 w-full',
              collapsed && 'justify-center'
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
} 
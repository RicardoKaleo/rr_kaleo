import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open sidebar">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 bg-background">
        <nav className="flex flex-col h-full">
          <div className="font-bold text-lg p-4">Softtech</div>
          <div className="text-xs text-muted-foreground px-4 pt-2 pb-1 uppercase tracking-wide">
            Overview
          </div>
          {navLinks.map(({ label, icon: Icon, href }) => (
            <Link key={label} href={href} className="flex items-center gap-3 px-6 py-2 rounded-md hover:bg-accent transition-colors">
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
          <div className="mt-6 text-xs text-muted-foreground px-4 pb-1 uppercase tracking-wide">
            Account
          </div>
          {accountLinks.map(({ label, icon: Icon, href }) => (
            <Link key={label} href={href} className="flex items-center gap-3 px-6 py-2 rounded-md hover:bg-accent transition-colors">
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
} 
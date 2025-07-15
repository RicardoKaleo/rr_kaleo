"use client";

import AuthGuard from '@/components/AuthGuard';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
        </div>
        {/* Mobile Sidebar */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <MobileSidebar />
        </div>
        {/* Main Content */}
        <main className="flex-1 p-4 md:ml-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
} 
"use client"

import ClientsDataTable from '@/components/clients/ClientsDataTable'
import { usePathname } from 'next/navigation'

export default function ClientsListPage() {
  const pathname = usePathname()
  return <ClientsDataTable key={pathname} />
} 
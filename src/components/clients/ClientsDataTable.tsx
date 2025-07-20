'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../ui/button';
import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from '../ui/badge';
import { ClientActions } from './ClientActions';
import { Mail } from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ['active', 'inactive', 'prospect'];

export default function ClientsDataTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Client>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Meta data state
  const [meta, setMeta] = useState<Record<string, any>>({});

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [globalFilter, setGlobalFilter] = useState('');

  // Function to fetch all client and meta data
  const fetchData = async () => {
      if (!user) return;
    setLoading(true);
      const supabase = createBrowserSupabaseClient();
      try {
        // First get the user's role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;
        let query = supabase.from('clients').select('*');
        if (profile.role === 'final_user') {
          const { data: finalUserClients, error: clientError } = await supabase
            .from('client_final_users')
            .select('client_id')
            .eq('final_user_id', user.id);
          if (clientError) throw clientError;
          if (finalUserClients && finalUserClients.length > 0) {
            query = query.in('id', finalUserClients.map(c => c.client_id));
          } else {
            setClients([]);
            setLoading(false);
            return;
          }
        } else if (profile.role === 'manager') {
          const { data: managerClients, error: clientError } = await supabase
            .from('client_managers')
            .select('client_id')
            .eq('manager_id', user.id);
          if (clientError) throw clientError;
          if (managerClients && managerClients.length > 0) {
            query = query.in('id', managerClients.map(c => c.client_id));
          }
        }
        const { data, error } = await query;
        if (error) throw error;
        setClients(data || []);
      await loadMeta(data || []); // Pass clients to loadMeta
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
  };
  
  useEffect(() => {
    fetchData();
  }, [user]);

  // Check for OAuth success on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('oauth_success') === 'true') {
      fetchData(); // Refetch all data
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);


  // Load meta data function
  const loadMeta = async (currentClients: Client[]) => {
    if (!user) return;
    const supabase = createBrowserSupabaseClient();
    try {
      const [metaResponse, gmailResponse] = await Promise.all([
        supabase.from('clients_meta').select('*'),
        supabase.from('gmail_integrations').select('*').eq('is_active', true)
      ]);
      
      if (metaResponse.error) throw metaResponse.error;
      if (gmailResponse.error) throw gmailResponse.error;
      
      // Convert array to object with client_id as key
      const metaMap = (metaResponse.data || []).reduce((acc, item) => {
        acc[item.client_id] = item;
        return acc;
      }, {} as Record<string, any>);

      // Add Gmail integration status to meta
      (gmailResponse.data || []).forEach(integration => {
        if (!metaMap[integration.client_id]) {
          metaMap[integration.client_id] = {};
        }
        metaMap[integration.client_id].gmail_integration = integration;
      });
      
      setMeta(metaMap);
    } catch (err) {
      console.error('Failed to load meta data:', err);
    }
  };

  // Load meta data on mount - This is now handled by fetchData
  // useEffect(() => {
  //   loadMeta();
  // }, [user]);

  // Inline edit handlers
  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setEditValues(client);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditSaving(true);
    setEditError(null);
    const supabase = createBrowserSupabaseClient();
    try {
      const { error } = await supabase
        .from('clients')
        .update(editValues)
        .eq('id', editingId);
      if (error) throw error;
      setClients(prev => prev.map(c => (c.id === editingId ? { ...c, ...editValues } : c)));
      setEditingId(null);
      setEditValues({});
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };

  // Filtering logic for status
  const filteredClients = useMemo(() => {
    if (!statusFilter || statusFilter === 'all') return clients;
    return clients.filter(c => c.status === statusFilter);
  }, [clients, statusFilter]);

  // Define columns for TanStack Table
  const columns = useMemo<ColumnDef<Client, any>[]>(() => [
    {
      accessorKey: 'first_name',
      header: 'First Name',
      enableSorting: true,
      cell: ({ row }) => row.original.id === editingId ? null : row.original.first_name,
    },
    {
      accessorKey: 'last_name',
      header: 'Last Name',
      enableSorting: true,
      cell: ({ row }) => row.original.id === editingId ? null : row.original.last_name,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      enableSorting: true,
      cell: ({ row }) => row.original.id === editingId ? null : row.original.email,
    },
    {
      accessorKey: 'company',
      header: 'Company',
      enableSorting: true,
      cell: ({ row }) => row.original.id === editingId ? null : row.original.company,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => row.original.id === editingId ? null : (
        <Badge className={`text-xs px-2 py-0.5 ${getStatusBadgeColor(row.original.status)}`} style={{ pointerEvents: 'none' }}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      enableSorting: true,
      cell: ({ row }) => row.original.id === editingId ? null : new Date(row.original.created_at).toLocaleDateString(),
    },

    {
      id: 'actions',
      header: () => <span className="block text-right w-full">Actions</span>,
      cell: ({ row }) => row.original.id === editingId ? null : (
        <div className="flex justify-end gap-2">
          <Button size="default" variant="outline" className="h-10" onClick={() => startEdit(row.original)}>
            Edit
          </Button>
          <ClientActions 
            client={row.original}
            meta={meta[row.original.id] || {}}
            onMetaChange={fetchData} // Use fetchData to refresh all data
          />
        </div>
      ),
    },
  ], [editingId, meta]);

  // Toolbar for status filter and add button
  const toolbar = (
    <div className="flex gap-2 items-center">
      <Select value={statusFilter || 'all'} onValueChange={val => setStatusFilter(val === 'all' ? '' : val)}>
        <SelectTrigger className="h-10 px-4 w-[160px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent side="bottom" align="start" position="popper">
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={() => router.push('/dashboard/clients/new')} className="h-10 px-4">
        <PlusIcon className="mr-2 h-4 w-4" />
        Add Client
      </Button>
    </div>
  );

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'inactive': return 'bg-gray-500 text-white';
      case 'prospect': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-foreground';
    }
  }

  // InlineEditRow component for editing a single client row
  function InlineEditRow({ client, onSave, onCancel, saving }: {
    client: Client;
    onSave: (values: Partial<Client>) => void;
    onCancel: () => void;
    saving: boolean;
  }) {
    const [values, setValues] = useState<Partial<Client>>(client);
    useEffect(() => { setValues(client); }, [client]);
    const handleChange = (field: keyof Client, value: string) => {
      setValues(prev => ({ ...prev, [field]: value }));
    };
    return <>
      <td className="p-4 align-middle">
        <Input value={values.first_name ?? ''} onChange={e => handleChange('first_name', e.target.value)} />
      </td>
      <td className="p-4 align-middle">
        <Input value={values.last_name ?? ''} onChange={e => handleChange('last_name', e.target.value)} />
      </td>
      <td className="p-4 align-middle">
        <Input value={values.email ?? ''} onChange={e => handleChange('email', e.target.value)} />
      </td>
      <td className="p-4 align-middle">
        <Input value={values.company ?? ''} onChange={e => handleChange('company', e.target.value)} />
      </td>
      <td className="p-4 align-middle">
        <Select value={values.status ?? ''} onValueChange={val => handleChange('status', val)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
      <td className="p-4 align-middle">
        <span>{new Date(client.created_at).toLocaleDateString()}</span>
      </td>
      <td className="p-4 align-middle">
        <div className="flex gap-2 justify-end">
          <Button size="default" className="h-10 font-medium" onClick={() => onSave(values)} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="default" variant="outline" className="h-10 font-medium" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </td>
    </>;
  }

  const table = useReactTable({
    data: filteredClients,
    columns,
    getRowId: row => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="container mx-auto py-10">
      {editError && <div className="text-red-500 mb-2">{editError}</div>}
      <div className="rounded-md border bg-background">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 border-b">
          <Input
            placeholder="Search clients..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="max-w-xs"
          />
          {toolbar}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="hover:bg-muted/40">
                  {headerGroup.headers.map(header => {
                    const isSortable = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={"h-12 px-4 align-middle font-medium text-muted-foreground select-none cursor-pointer" + (header.id === 'actions' ? ' text-right' : ' text-left')}
                        onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div className="flex items-center gap-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {isSortable && (
                            <span>
                              {sortDir === 'asc' && <ArrowUp className="w-4 h-4 inline" />}
                              {sortDir === 'desc' && <ArrowDown className="w-4 h-4 inline" />}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row =>
                  row.original.id === editingId ? (
                    <tr key={row.id}>
                      <InlineEditRow
                        client={row.original}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        saving={editSaving}
                      />
                    </tr>
                  ) : (
                    <tr key={row.id} className="transition-colors hover:bg-muted/40">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">No results.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
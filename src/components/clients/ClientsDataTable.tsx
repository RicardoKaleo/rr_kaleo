'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../ui/button';
import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent } from '../ui/sheet';
import { ClientMetaForm } from './ClientMetaForm';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Info, Save } from 'lucide-react';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from '../ui/badge';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  created_at: string;
}

interface ClientMeta {
  [key: string]: any;
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

  // Meta drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [meta, setMeta] = useState<ClientMeta>({});
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaSaving, setMetaSaving] = useState(false);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    async function fetchClients() {
      if (!user) return;
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
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [user]);

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

  // Meta drawer handlers (unchanged)
  const handleOpenMeta = async (client: Client) => {
    setSelectedClient(client);
    setDrawerOpen(true);
    setMetaLoading(true);
    setMetaError(null);
    const supabase = createBrowserSupabaseClient();
    try {
      const { data, error } = await supabase
        .from('clients_meta')
        .select('*')
        .eq('client_id', client.id)
        .single();
      if (error) throw error;
      setMeta(data || {});
    } catch (err: any) {
      setMetaError(err.message || 'Failed to load meta data');
      setMeta({});
    } finally {
      setMetaLoading(false);
    }
  };
  const handleSaveMeta = async () => {
    if (!selectedClient) return;
    setMetaSaving(true);
    setMetaError(null);
    const supabase = createBrowserSupabaseClient();
    try {
      const { error } = await supabase
        .from('clients_meta')
        .upsert({ ...meta, client_id: selectedClient.id }, { onConflict: 'client_id' });
      if (error) throw error;
      setDrawerOpen(false);
    } catch (err: any) {
      setMetaError(err.message || 'Failed to save meta data');
    } finally {
      setMetaSaving(false);
    }
  };

  // Filtering logic for status
  const filteredClients = useMemo(() => {
    if (!statusFilter || statusFilter === 'all') return clients;
    return clients.filter(c => c.status === statusFilter);
  }, [clients, statusFilter]);

  // Toolbar for status filter and add button
  const toolbar = (
    <div className="flex gap-2 items-center">
      <Select value={statusFilter || 'all'} onValueChange={val => setStatusFilter(val === 'all' ? undefined : val)}>
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

  const cellInputClass =
    "w-full bg-transparent border border-transparent px-4 h-8 leading-8 text-foreground text-sm font-normal rounded focus:border-primary focus:ring-0 focus:outline-none shadow-none min-w-0 transition-colors";
  const cellSelectClass =
    "w-full bg-transparent border border-transparent px-4 h-8 leading-8 text-foreground text-sm font-normal rounded focus:border-primary focus:ring-0 focus:outline-none shadow-none min-w-0 transition-colors appearance-none";

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
        <Input value={values.name ?? ''} onChange={e => handleChange('name', e.target.value)} />
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

  // Define columns for TanStack Table, but use a custom cell renderer for the edit row
  const columns = useMemo<ColumnDef<Client, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => row.original.id === editingId ? null : row.original.name,
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
        <Badge className={`text-base px-4 py-1 ${getStatusBadgeColor(row.original.status)}`} style={{ pointerEvents: 'none' }}>
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
        <div className="flex gap-2 justify-end">
          <Button size="default" variant="outline" className="h-10" onClick={() => startEdit(row.original)}>
            Edit
          </Button>
          <Button size="default" variant="outline" className="h-10 min-w-[2.5rem] flex items-center justify-center" onClick={() => handleOpenMeta(row.original)} aria-label="Meta Info">
            <Info className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], [editingId]);

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
                        onSave={async (values) => {
                          setEditSaving(true);
                          setEditError(null);
                          try {
                            const supabase = createBrowserSupabaseClient();
                            const { error } = await supabase
                              .from('clients')
                              .update(values)
                              .eq('id', row.original.id);
                            if (error) throw error;
                            setClients(prev => prev.map(c => (c.id === row.original.id ? { ...c, ...values } : c)));
                            setEditingId(null);
                            setEditValues({});
                          } catch (err: any) {
                            setEditError(err.message || 'Failed to save changes');
                          } finally {
                            setEditSaving(false);
                          }
                        }}
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
      {/* Meta drawer remains unchanged */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full max-w-lg flex flex-col h-full">
          {selectedClient && (
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-semibold mb-4">Info of {selectedClient.name}</h3>
              <div className="flex-1 overflow-y-auto">
                {metaLoading ? (
                  <div>Loading...</div>
                ) : metaError ? (
                  <div className="text-red-500 mb-4">{metaError}</div>
                ) : (
                  <ClientMetaForm value={meta} onChange={setMeta} readOnly={false} noCard noTitle />
                )}
              </div>
              <div className="pt-4 border-t bg-background sticky bottom-0 flex justify-end z-10">
                <Button onClick={handleSaveMeta} disabled={metaSaving} className="w-full flex items-center justify-center gap-2">
                  <Save className="w-4 h-4 mr-2" />
                  {metaSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
} 
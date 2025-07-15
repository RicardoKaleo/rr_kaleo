import React, { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { DataTable } from '../ui/DataTable';
import { Sheet, SheetContent } from '../ui/sheet';
import { supabase } from '@/lib/supabase';
import { ClientMetaForm } from './ClientMetaForm';
import { useEffect as useDrawerEffect } from 'react';

const STATUS_OPTIONS = ['active', 'inactive', 'prospect'] as const;

export function ClientsDataTable() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [metaForm, setMetaForm] = useState<any>({});
  const [metaLoading, setMetaLoading] = useState(false);

  // Fetch latest client meta data by client_id when opening the drawer
  useDrawerEffect(() => {
    const fetchLatestMeta = async () => {
      if (drawerOpen && selectedClient) {
        console.log('[MetaDrawer] Selected client:', selectedClient);
        console.log('[MetaDrawer] selectedClient.id:', selectedClient.id);
        if (!selectedClient.id) {
          console.warn('[MetaDrawer] selectedClient.id is not defined, skipping meta fetch.');
          setMetaForm({});
          return;
        }
        const { data, error, status } = await supabase.from('clients_meta').select('*').eq('client_id', String(selectedClient.id)).single();
        console.log('[MetaDrawer] Fetched meta from clients_meta:', data, error, status);
        if (error && status === 406) {
          // 406: No rows found, treat as no meta
          setMetaForm({});
          console.warn('[MetaDrawer] 406 No meta found for client_id:', selectedClient.id);
        } else if (data) {
          setMetaForm(data);
          console.log('[MetaDrawer] Set metaForm:', data);
        } else {
          setMetaForm({});
          console.log('[MetaDrawer] Set metaForm: {} (no data)');
        }
      }
    };
    fetchLatestMeta();
  }, [drawerOpen, selectedClient]);

  const handleMetaChange = (meta: any) => {
    setMetaForm(meta);
  };

  const handleMetaSave = async () => {
    if (!selectedClient) return;
    setMetaLoading(true);
    setError(null);
    // Upsert meta data for the client
    const { error } = await supabase
      .from('clients_meta')
      .upsert({ ...metaForm, client_id: selectedClient.id }, { onConflict: 'client_id' });
    setMetaLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setDrawerOpen(false);
      fetchClients();
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    setClients(data || []);
    setLoading(false);
  };

  const handleRowUpdate = async (row: any, values: any) => {
    setError(null);
    const { error } = await supabase.from('clients').update(values).eq('id', row.original.id);
    if (error) setError(error.message);
    fetchClients();
  };

  const filteredClients = clients.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.status?.toLowerCase().includes(s)
    );
  });

  const cellClass = "font-normal text-sm leading-[1.25rem] px-2 py-0 h-8 w-full border-none bg-transparent shadow-none focus:ring-0 focus:outline-none appearance-none min-w-0 truncate";
  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      meta: {
        editable: true,
        width: 'w-32 min-w-32', // 8rem
        editComponent: ({ value, onChange }: any) => (
          <Input
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className={cellClass}
            style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}
          />
        ),
      },
      cell: (info: any) => <span className={"flex items-center font-normal text-sm leading-[1.25rem] h-8 w-full min-w-0 truncate"} style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{info.getValue() ?? ''}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      meta: {
        editable: true,
        width: 'w-48 min-w-48', // 12rem
        editComponent: ({ value, onChange }: any) => (
          <Input
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className={cellClass}
            style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}
          />
        ),
      },
      cell: (info: any) => <span className={"flex items-center font-normal text-sm leading-[1.25rem] h-8 w-full min-w-0 truncate"} style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{info.getValue() ?? ''}</span>,
    },
    {
      accessorKey: 'company',
      header: 'Company',
      meta: {
        editable: true,
        width: 'w-32 min-w-32',
        editComponent: ({ value, onChange }: any) => (
          <Input
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className={cellClass}
            style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}
          />
        ),
      },
      cell: (info: any) => <span className={"flex items-center font-normal text-sm leading-[1.25rem] h-8 w-full min-w-0 truncate"} style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{info.getValue() ?? ''}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      meta: {
        editable: true,
        width: 'w-28 min-w-28',
        editComponent: ({ value, onChange }: any) => (
          <Input
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className={cellClass}
            style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}
          />
        ),
      },
      cell: (info: any) => <span className={"flex items-center font-normal text-sm leading-[1.25rem] h-8 w-full min-w-0 truncate"} style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{info.getValue() ?? ''}</span>,
    },
    {
      accessorKey: 'linkedin_url',
      header: 'LinkedIn',
      meta: {
        editable: true,
        width: 'w-48 min-w-48',
        editComponent: ({ value, onChange }: any) => (
          <Input
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className={cellClass}
            style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}
          />
        ),
      },
      cell: (info: any) => <span className={"flex items-center font-normal text-sm leading-[1.25rem] h-8 w-full min-w-0 truncate"} style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{info.getValue() ?? ''}</span>,
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      meta: {
        editable: true,
        width: 'w-48 min-w-48',
        editComponent: ({ value, onChange }: any) => (
          <Input
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className={cellClass}
            style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}
          />
        ),
      },
      cell: (info: any) => <span className={"flex items-center font-normal text-sm leading-[1.25rem] h-8 w-full min-w-0 truncate"} style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{info.getValue() ?? ''}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: {
        editable: true,
        width: 'w-28 min-w-28',
        editComponent: ({ value, onChange }: any) => (
          <select
            className={cellClass + " rounded"}
            style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ),
      },
      cell: (info: any) => <span className={"flex items-center font-normal text-sm leading-[1.25rem] h-8 w-full min-w-0 truncate"} style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{info.getValue() ?? ''}</span>,
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search by name, email, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
      </div>
      <Separator />
      <div className="w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredClients}
          onRowUpdate={handleRowUpdate}
          actions={(row: any) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedClient(row.original);
                setDrawerOpen(true);
              }}
            >
              Update
            </Button>
          )}
          minWidthClass="min-w-[900px]"
        />
      </div>
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] h-full flex flex-col p-0">
          {selectedClient && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6">
                <ClientMetaForm value={metaForm} onChange={handleMetaChange} readOnly={metaLoading} />
              </div>
              <div className="border-t p-4 flex justify-end gap-2 bg-background sticky bottom-0 z-10">
                <Button variant="outline" onClick={() => setDrawerOpen(false)} disabled={metaLoading}>Cancel</Button>
                <Button onClick={handleMetaSave} disabled={metaLoading}>
                  {metaLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
    </div>
  );
} 
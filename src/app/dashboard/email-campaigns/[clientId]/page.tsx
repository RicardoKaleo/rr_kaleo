'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmailCampaign {
  id: string;
  job_listing_id: string;
  gmail_integration_id: string;
  template_id?: string;
  custom_subject: string;
  custom_body: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  thread_id?: string;
  replied_at?: string;
  reply_status: string;
  created_at: string;
  // Joined data
  job_listing?: {
    title: string;
    company: string;
    client_id: string;
  };
  client?: {
    name: string;
  };
  gmail_integration?: {
    email_address: string;
  };
}

interface ClientCampaignStats {
  total: number;
  sent: number;
  replied: number;
  done: number;
  withReplies: number;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

export default function ClientEmailCampaignsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId);
  const [stats, setStats] = useState<ClientCampaignStats>({
    total: 0,
    sent: 0,
    replied: 0,
    done: 0,
    withReplies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    fetchClients();
    if (clientId && clientId !== 'all') {
      setSelectedClientId(clientId);
      fetchClientCampaigns(clientId);
      fetchClientName(clientId);
    } else {
      setSelectedClientId('');
      setClientName('Select a Client');
      setCampaigns([]);
      setStats({
        total: 0,
        sent: 0,
        replied: 0,
        done: 0,
        withReplies: 0,
      });
    }
  }, [clientId]);

  useEffect(() => {
    if (selectedClientId && selectedClientId !== clientId) {
      router.push(`/dashboard/email-campaigns/${selectedClientId}`);
    }
  }, [selectedClientId, clientId, router]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }

      setClients(data || []);
    } catch (err) {
      console.error('Error in fetchClients:', err);
    }
  };

  const fetchClientName = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('id', clientId)
        .single();

      if (error) {
        console.error('Error fetching client name:', error);
        return;
      }

      setClientName(data ? `${data.first_name} ${data.last_name}` : 'Unknown Client');
    } catch (err) {
      console.error('Error in fetchClientName:', err);
    }
  };

  const fetchClientCampaigns = async (clientId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

      // First, fetch job listings for this client
      const { data: jobListingsData, error: jobListingsError } = await supabase
        .from('job_listings')
        .select('id, title, company')
        .eq('client_id', clientId);

      if (jobListingsError) {
        console.error('Error fetching job listings:', jobListingsError);
        setError(`Failed to fetch job listings: ${jobListingsError.message}`);
        return;
      }

      if (!jobListingsData || jobListingsData.length === 0) {
        setCampaigns([]);
        setStats({
          total: 0,
          sent: 0,
          replied: 0,
          done: 0,
          withReplies: 0,
        });
        return;
      }

      const jobListingIds = jobListingsData.map(jl => jl.id);

      // Fetch campaigns for these job listings
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('email_campaigns')
        .select('*')
        .in('job_listing_id', jobListingIds)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        setError(`Failed to fetch campaigns: ${campaignsError.message}`);
        return;
      }

      console.log('Campaigns data:', campaignsData);

      // If we have campaigns, fetch related data
      if (campaignsData && campaignsData.length > 0) {
        const gmailIntegrationIds = campaignsData.map(c => c.gmail_integration_id).filter(Boolean);

        // Fetch Gmail integrations
        const { data: gmailIntegrationsData } = await supabase
          .from('gmail_integrations')
          .select('id, email_address')
          .in('id', gmailIntegrationIds);

        // Combine the data
        const enrichedData = campaignsData.map(campaign => ({
          ...campaign,
          job_listing: jobListingsData?.find(jl => jl.id === campaign.job_listing_id),
          gmail_integration: gmailIntegrationsData?.find(gi => gi.id === campaign.gmail_integration_id),
        }));

        setCampaigns(enrichedData);

        // Calculate stats for this client
        const stats = {
          total: enrichedData.length,
          sent: enrichedData.filter(c => c.status === 'sent').length,
          replied: enrichedData.filter(c => c.status === 'replied').length,
          done: enrichedData.filter(c => c.status === 'done').length,
          withReplies: enrichedData.filter(c => c.replied_at).length,
        };

        setStats(stats);
      } else {
        // No campaigns found
        setCampaigns([]);
        setStats({
          total: 0,
          sent: 0,
          replied: 0,
          done: 0,
          withReplies: 0,
        });
      }
    } catch (err) {
      console.error('Error in fetchClientCampaigns:', err);
      setError('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { label: 'Sent', variant: 'default' as const, icon: Mail },
      replied: { label: 'Replied', variant: 'default' as const, icon: CheckCircle },
      done: { label: 'Done', variant: 'secondary' as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getReplyStatus = (campaign: EmailCampaign) => {
    if (campaign.replied_at) {
      return (
        <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Replied
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        No Reply
      </Badge>
    );
  };

  const columns: ColumnDef<EmailCampaign>[] = [
    {
      accessorKey: 'job_listing.title',
      header: 'Job Title',
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div className="font-medium">
            {campaign.job_listing?.title || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'job_listing.company',
      header: 'Company',
      cell: ({ row }) => {
        const campaign = row.original;
        return campaign.job_listing?.company || 'N/A';
      },
    },
    {
      accessorKey: 'reply_status',
      header: 'Reply Status',
      cell: ({ row }) => getReplyStatus(row.original),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'sent_at',
      header: 'Sent Date',
      cell: ({ row }) => {
        const campaign = row.original;
        if (!campaign.sent_at) return 'Not sent';
        return new Date(campaign.sent_at).toLocaleDateString();
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const campaign = row.original;
        const jobListingId = campaign.job_listing_id;
        
        if (!jobListingId) return null;
        
        return (
          <Link href={`/dashboard/job-listings/${jobListingId}`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              View Job
            </Button>
          </Link>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with client selector */}
      <div className="space-y-4">
        {/* Client Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Client:</span>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold">{clientName}</h1>
          <p className="text-muted-foreground">Email Campaigns</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replied</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.replied}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Replies</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withReplies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${Math.round((stats.withReplies / stats.total) * 100)}%` : '0%'} response rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Campaigns - {clientName}</CardTitle>
          <CardDescription>
            All email campaigns for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <DataTable
              columns={columns}
              data={campaigns}
              loading={loading}
              filterPlaceholder="Filter campaigns..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
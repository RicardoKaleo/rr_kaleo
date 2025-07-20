'use client';

import { useState } from 'react';
import { MoreHorizontal, Save, Mail, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ClientMetaForm } from './ClientMetaForm';
import GmailIntegration from './GmailIntegration';
import { upsertClientMeta } from '@/lib/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

interface ClientActionsProps {
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company: string | null;
    status: string;
    created_at: string;
  };
  meta: any;
  onMetaChange?: () => void;
}

export function ClientActions({ client, meta: initialMeta, onMetaChange }: ClientActionsProps) {
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [gmailDialogOpen, setGmailDialogOpen] = useState(false);
  const [meta, setMeta] = useState(initialMeta || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveMeta = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error } = await upsertClientMeta(client.id, meta);
      if (error) throw error;
      setMetaDialogOpen(false);
      if (onMetaChange) onMetaChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meta data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/email-campaigns/${client.id}`} className="flex items-center gap-2 w-full">
              <Mail className="h-4 w-4" />
              Email Campaigns
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setGmailDialogOpen(true)} className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h.819L12 10.91l9.545-7.089h.819A1.636 1.636 0 0 1 24 5.457z"/>
            </svg>
            Gmail Integration
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMetaDialogOpen(true)} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Update Meta Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Meta Data Dialog */}
      <Dialog open={metaDialogOpen} onOpenChange={setMetaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Meta Data - {client.first_name} {client.last_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ClientMetaForm 
              value={meta} 
              onChange={setMeta} 
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMetaDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMeta}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Meta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gmail Integration Dialog */}
      <Dialog open={gmailDialogOpen} onOpenChange={setGmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gmail Integration - {client.first_name} {client.last_name}</DialogTitle>
          </DialogHeader>
          <GmailIntegration 
            clientId={client.id} 
            clientName={`${client.first_name} ${client.last_name}`} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 
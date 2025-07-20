'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  Calendar,
  FileText,
  User,
  Building,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

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
  reply_content?: string;
  reply_sender?: string;
  reply_message_id?: string;
  created_at: string;
  // Joined data
  job_listing?: {
    title: string;
    company: string;
    client_id: string;
  };
  client?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  gmail_integration?: {
    email_address: string;
  };
  template?: {
    name: string;
    subject: string;
    body: string;
  };
  followups?: {
    id: string;
    second_followup_enabled: boolean;
    second_followup_template_id?: string;
    second_followup_days_after: number;
    third_followup_enabled: boolean;
    third_followup_template_id?: string;
    third_followup_days_after: number;
    second_followup_sent_at?: string;
    third_followup_sent_at?: string;
  };
}

interface EmailCampaignDetailsProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailCampaignDetails({ campaignId, open, onOpenChange }: EmailCampaignDetailsProps) {
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (open && campaignId) {
      fetchCampaignDetails();
    }
  }, [open, campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

      // Fetch campaign with all related data
      const { data: campaignData, error: campaignError } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          job_listing:job_listings(
            title,
            company,
            client_id
          ),
          gmail_integration:gmail_integrations(
            email_address
          ),
          template:email_templates(
            name,
            subject,
            body
          )
        `)
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        console.error('Error fetching campaign details:', campaignError);
        setError('Failed to fetch campaign details');
        return;
      }

      // Fetch client data separately
      if (campaignData?.job_listing?.client_id) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, first_name, last_name')
          .eq('id', campaignData.job_listing.client_id)
          .single();

        if (!clientError && clientData) {
          campaignData.client = clientData;
        }
      }

      // Fetch followups separately
      const { data: followupsData, error: followupsError } = await supabase
        .from('email_campaign_followups')
        .select('*')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (followupsData) {
        campaignData.followups = followupsData;
      } else {
        campaignData.followups = null;
      }

      if (campaignError) {
        console.error('Error fetching campaign details:', campaignError);
        setError('Failed to fetch campaign details');
        return;
      }

      setCampaign(campaignData);
    } catch (err) {
      console.error('Error in fetchCampaignDetails:', err);
      setError('Failed to fetch campaign details');
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

  const getReplyStatusBadge = (campaign: EmailCampaign) => {
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

  const formatReplyContent = (content: string): string => {
    if (!content) return '';
    
    // Apply aggressive cleaning to extract only the actual reply
    let cleaned = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Split by common email thread markers and take the first part
    const threadMarkers = [
      'On ',
      'From:',
      'Sent:',
      'To:',
      'Subject:',
      'wrote:',
      '<',
      '@'
    ];
    
    let shortestIndex = cleaned.length;
    for (const marker of threadMarkers) {
      const index = cleaned.indexOf(marker);
      if (index > 0 && index < shortestIndex) {
        shortestIndex = index;
      }
    }
    
    if (shortestIndex < cleaned.length) {
      cleaned = cleaned.substring(0, shortestIndex).trim();
    }
    
    // If still too long, take just the first sentence or first 100 characters
    if (cleaned.length > 100) {
      const firstSentence = cleaned.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 200) {
        cleaned = firstSentence.trim() + (cleaned.includes('.') || cleaned.includes('!') || cleaned.includes('?') ? '.' : '');
      } else {
        cleaned = cleaned.substring(0, 100) + '...';
      }
    }
    
    return cleaned || 'Reply content could not be parsed';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !campaign) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          <div className="text-center text-red-500 py-8">
            {error || 'Campaign not found'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Campaign Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-base">
          {/* Campaign Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Campaign Overview</span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(campaign.status)}
                  {getReplyStatusBadge(campaign)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Client:</span>
                  <span>{campaign.client ? `${campaign.client.first_name} ${campaign.client.last_name}` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Company:</span>
                  <span>{campaign.job_listing?.company || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Job Title:</span>
                  <span>{campaign.job_listing?.title || 'N/A'}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                </div>
                {campaign.replied_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Replied:</span>
                    <span>{new Date(campaign.replied_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                {campaign.template ? `Using template: ${campaign.template.name}` : 'Custom email content'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Subject:</span>
                <p className="mt-1 bg-muted p-3 rounded border">{campaign.custom_subject || campaign.template?.subject || 'No subject'}</p>
              </div>
              <div>
                <span className="font-medium">Body:</span>
                <div 
                  className="mt-1 bg-muted p-4 rounded border max-h-64 overflow-y-auto prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: campaign.custom_body || campaign.template?.body || 'No content' 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reply Details */}
          {campaign.replied_at && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Reply Received
                </CardTitle>
                <CardDescription className="text-green-700">
                  Reply received on {new Date(campaign.replied_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {campaign.reply_sender && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">From</div>
                      <div className="font-medium text-green-800">{campaign.reply_sender}</div>
                    </div>
                  </div>
                )}
                
                {campaign.reply_content && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">Reply Message</span>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-green-700">
                            {campaign.reply_sender ? campaign.reply_sender.charAt(0).toUpperCase() : 'R'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-green-800">
                              {campaign.reply_sender || 'Reply'}
                            </span>
                            <span className="text-xs text-green-600">
                              {campaign.replied_at ? new Date(campaign.replied_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 border-l-3 border-green-400">
                            <div className="text-gray-800 leading-relaxed">
                              <div className="text-base font-medium text-gray-900">
                                {formatReplyContent(campaign.reply_content)}
                              </div>
                              {campaign.reply_content && campaign.reply_content.length > 200 && (
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                  <button 
                                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                                    onClick={() => {
                                      alert('Full content:\n\n' + campaign.reply_content);
                                    }}
                                  >
                                    View full message
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {campaign.reply_message_id && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 p-2 rounded border border-green-200">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    Message ID: {campaign.reply_message_id}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Followup Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Followup Configuration</CardTitle>
              <CardDescription>Automated followup settings for this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.followups ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Second Followup */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Second Followup</h4>
                      <Badge variant={campaign.followups.second_followup_enabled ? "default" : "secondary"}>
                        {campaign.followups.second_followup_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {campaign.followups.second_followup_enabled && (
                      <div className="space-y-2 text-sm">
                        <div>Days after: {campaign.followups.second_followup_days_after}</div>
                        {campaign.followups.second_followup_sent_at && (
                          <div>Sent: {new Date(campaign.followups.second_followup_sent_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Third Followup */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Third Followup</h4>
                      <Badge variant={campaign.followups.third_followup_enabled ? "default" : "secondary"}>
                        {campaign.followups.third_followup_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {campaign.followups.third_followup_enabled && (
                      <div className="space-y-2 text-sm">
                        <div>Days after: {campaign.followups.third_followup_days_after}</div>
                        {campaign.followups.third_followup_sent_at && (
                          <div>Sent: {new Date(campaign.followups.third_followup_sent_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No followup configuration found for this campaign.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {campaign.job_listing?.client_id && (
              <Link href={`/dashboard/email-campaigns/${campaign.job_listing.client_id}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Client's Campaigns
                </Button>
              </Link>
            )}
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
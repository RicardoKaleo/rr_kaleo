'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientMetaForm } from '@/components/clients/ClientMetaForm';
import { ArrowLeft, Save } from 'lucide-react';

interface ClientData {
  name: string;
  email: string;
  company: string;
  status: string;
}

// Use the same ClientMeta type as in ClientMetaForm
type ClientMeta = {
  gender?: 'Female' | 'Male' | 'Non-Binary' | null;
  ethnicity?: 'Asian' | 'Black or African American' | 'Hispanic or Latino' | 'Native American or Native Alaska' | 'Native Haiwaiian or other Pacific Islander' | 'Two or more races' | null;
  veteran_status?: 'I am a protected veteran' | 'I am a veteran but not protected' | 'I am not a veteran' | null;
  disability?: "I don't have a disability" | 'I have a disability' | null;
  salary_expectations?: string | null;
  notice_period?: string | null;
  title_role?: string | null;
  travel_percent?: number | null;
  client_references?: string | null;
  geographic_preferences?: string | null;
  work_experience?: string | null;
  work_preference?: 'Full Remote' | 'Hybrid' | 'On-Site' | null;
  visa_status?: 'I have a work permit' | 'I need to be sponsored for VISA' | "I'm a citizen" | 'Other (Comment to Specify)' | null;
  observations?: string | null;
};

const STATUS_OPTIONS = ['active', 'inactive', 'prospect'];

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    email: '',
    company: '',
    status: 'active'
  });
  
  const [clientMeta, setClientMeta] = useState<ClientMeta>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      
      // Insert client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) throw clientError;

      // Insert client meta if provided
      if (showMeta && Object.keys(clientMeta).length > 0) {
        const { error: metaError } = await supabase
          .from('clients_meta')
          .insert({ ...clientMeta, client_id: client.id });

        if (metaError) throw metaError;
      }

      router.push('/dashboard/clients');
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientData, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Client</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={clientData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter client email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={clientData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={clientData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Meta Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showMeta"
                checked={showMeta}
                onCheckedChange={(checked: boolean) => setShowMeta(checked)}
              />
              <Label htmlFor="showMeta" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Include Additional Client Information
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Client Meta Card */}
        {showMeta && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientMetaForm
                value={clientMeta}
                onChange={setClientMeta}
                readOnly={false}
                noCard
                noTitle
              />
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Client'}
          </Button>
        </div>
      </form>
    </div>
  );
} 
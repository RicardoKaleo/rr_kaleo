"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from 'sonner';

const STATUS_OPTIONS = ["active", "paused", "closed", "applied", "interview_scheduled", "rejected", "offer_received"];
const APPLICATION_METHOD_OPTIONS = [
  "email",
  "linkedin",
  "job_search_site",
  "company_portal",
  "other",
];

export default function NewJobListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client");
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecruiter, setShowRecruiter] = useState(false);

  const initialListingData = {
    title: "",
    company: "",
    location: "",
    salary_range: "",
    job_url: "",
    description: "",
    application_method: "email",
    status: "active",
    recruiter_name: "",
    recruiter_email: "",
    recruiter_company: "",
    recruiter_title: "",
    recruiter_linkedin: "",
  };
  const [listingData, setListingData] = useState(initialListingData);

  useEffect(() => {
    if (!clientId) return;
    async function fetchClient() {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, company")
        .eq("id", clientId)
        .single();
      if (!error) setClient(data);
    }
    fetchClient();
  }, [clientId]);

  const handleInputChange = (field: string, value: string) => {
    setListingData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      // 1. Insert job listing (exclude recruiter fields)
      const jobPayload: any = {
        title: listingData.title,
        company: listingData.company,
        location: listingData.location,
        salary_range: listingData.salary_range,
        job_url: listingData.job_url,
        description: listingData.description,
        application_method: listingData.application_method,
        status: listingData.status,
        client_id: clientId,
      };
      const { data: job, error: jobError } = await supabase
        .from("job_listings")
        .insert(jobPayload)
        .select()
        .single();
      if (jobError) throw jobError;
      // 2. If recruiter info is provided, handle recruiter logic
      if (showRecruiter && listingData.recruiter_email) {
        // Try to find recruiter by email
        let recruiterId: string | null = null;
        const { data: existingRecruiter } = await supabase
          .from("recruiters")
          .select("id")
          .eq("email", listingData.recruiter_email)
          .single();
        if (existingRecruiter && existingRecruiter.id) {
          recruiterId = existingRecruiter.id;
        } else {
          // Insert new recruiter
          const recruiterPayload: any = {
            name: listingData.recruiter_name,
            email: listingData.recruiter_email,
            company: listingData.recruiter_company,
            position: listingData.recruiter_title,
            linkedin_url: listingData.recruiter_linkedin,
          };
          const { data: newRecruiter, error: recruiterError } = await supabase
            .from("recruiters")
            .insert(recruiterPayload)
            .select()
            .single();
          if (recruiterError) throw recruiterError;
          recruiterId = newRecruiter.id;
        }
        // 3. Link recruiter to job listing
        if (recruiterId) {
          const { error: linkError } = await supabase
            .from("job_recruiters")
            .insert({ job_listing_id: job.id, recruiter_id: recruiterId });
          if (linkError) throw linkError;
        }
      }
      toast.success('Job listing created', { description: 'The job listing was successfully created.' });
      setListingData(initialListingData);
      setShowRecruiter(false);
    } catch (err: any) {
      setError(err.message || "Failed to create job listing");
      toast.error('Error', { description: err.message || 'Failed to create job listing' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Job Listing</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent>
            {client ? (
              <div className="text-lg font-semibold">
                {client.first_name} {client.last_name} <span className="text-muted-foreground">({client.company})</span>
              </div>
            ) : (
              <div className="text-muted-foreground">Loading client info...</div>
            )}
          </CardContent>
        </Card>
        {/* Listing Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Job Listing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={listingData.title} onChange={e => handleInputChange("title", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Input id="company" value={listingData.company} onChange={e => handleInputChange("company", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input id="location" value={listingData.location} onChange={e => handleInputChange("location", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input id="salary_range" value={listingData.salary_range} onChange={e => handleInputChange("salary_range", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="job_url">Job URL</Label>
                <Input id="job_url" value={listingData.job_url} onChange={e => handleInputChange("job_url", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={listingData.description} onChange={e => handleInputChange("description", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="application_method">Application Method *</Label>
                <Select value={listingData.application_method} onValueChange={val => handleInputChange("application_method", val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_METHOD_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={listingData.status} onValueChange={val => handleInputChange("status", val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Recruiter Info Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="showRecruiter" checked={showRecruiter} onCheckedChange={(checked: boolean) => setShowRecruiter(checked)} />
              <Label htmlFor="showRecruiter" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Include Recruiter Information
              </Label>
            </div>
          </CardContent>
        </Card>
        {/* Recruiter Info Card */}
        {showRecruiter && (
          <Card>
            <CardHeader>
              <CardTitle>Recruiter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recruiter_name">Recruiter Name</Label>
                  <Input id="recruiter_name" value={listingData.recruiter_name} onChange={e => handleInputChange("recruiter_name", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="recruiter_email">Recruiter Email</Label>
                  <Input id="recruiter_email" value={listingData.recruiter_email} onChange={e => handleInputChange("recruiter_email", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="recruiter_company">Recruiter Company</Label>
                  <Input id="recruiter_company" value={listingData.recruiter_company} onChange={e => handleInputChange("recruiter_company", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="recruiter_title">Recruiter Title</Label>
                  <Input id="recruiter_title" value={listingData.recruiter_title} onChange={e => handleInputChange("recruiter_title", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="recruiter_linkedin">Recruiter LinkedIn Profile</Label>
                  <Input id="recruiter_linkedin" value={listingData.recruiter_linkedin} onChange={e => handleInputChange("recruiter_linkedin", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import JobListingsDataTable from "@/components/jobs/JobListingsDataTable";

export default function JobListingsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [jobListings, setJobListings] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Fetch active clients assigned to the user
  useEffect(() => {
    async function fetchClients() {
      if (!user) return;
      setLoadingClients(true);
      const supabase = createBrowserSupabaseClient();
      // Get user role
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profileError) return;
      let query = supabase.from("clients").select("id, first_name, last_name, status");
      if (profile.role === "final_user") {
        const { data: finalUserClients } = await supabase
          .from("client_final_users")
          .select("client_id")
          .eq("final_user_id", user.id);
        if (finalUserClients && finalUserClients.length > 0) {
          query = query.in("id", finalUserClients.map((c: any) => c.client_id));
        } else {
          setClients([]);
          setLoadingClients(false);
          return;
        }
      } else if (profile.role === "manager") {
        const { data: managerClients } = await supabase
          .from("client_managers")
          .select("client_id")
          .eq("manager_id", user.id);
        if (managerClients && managerClients.length > 0) {
          query = query.in("id", managerClients.map((c: any) => c.client_id));
        }
      }
      const { data, error } = await query.eq("status", "active");
      if (!error) setClients(data || []);
      setLoadingClients(false);
    }
    fetchClients();
  }, [user]);

  // Fetch job listings for selected client
  useEffect(() => {
    async function fetchJobListings() {
      if (!selectedClient) return;
      setLoadingJobs(true);
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("job_listings")
        .select("*, email_campaigns(id)")
        .eq("client_id", selectedClient);
      
      if (!error) {
        const listingsWithCampaignStatus = data.map(listing => ({
          ...listing,
          has_campaign: listing.email_campaigns.length > 0,
        }));
        setJobListings(listingsWithCampaignStatus);
      }
      setLoadingJobs(false);
    }
    fetchJobListings();
  }, [selectedClient]);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Job Listings</h1>
      <div className="mb-6 max-w-md">
        <Select
          value={selectedClient || ""}
          onValueChange={setSelectedClient}
          disabled={loadingClients || clients.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a client..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client: any) => (
              <SelectItem key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedClient && (
        <JobListingsDataTable
          jobListings={jobListings}
          loading={loadingJobs}
          onAdd={() => window.location.href = `/dashboard/job-listings/new?client=${selectedClient}`}
          onUpdate={async (id, values) => {
            const supabase = createBrowserSupabaseClient();
            const { error } = await supabase
              .from('job_listings')
              .update(values)
              .eq('id', id);
            if (error) throw error;
            setJobListings(jobs => jobs.map(j => j.id === id ? { ...j, ...values } : j));
          }}
        />
      )}
    </div>
  );
} 
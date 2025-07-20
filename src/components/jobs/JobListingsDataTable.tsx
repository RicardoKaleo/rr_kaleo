"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Mail } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface JobListing {
  id: string;
  client_id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  application_method: string;
  status: string;
  created_at: string;
  has_campaign?: boolean;
}

interface JobListingsDataTableProps {
  jobListings: JobListing[];
  loading: boolean;
  onAdd: () => void;
  onUpdate: (id: string, values: Partial<JobListing>) => Promise<void>;
}

const STATUS_OPTIONS = ["active", "paused", "closed", "applied", "interview_scheduled", "rejected", "offer_received"];

// Utility to format enum values for display
function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Color mapping for status and application_method
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-600 text-white',
  paused: 'bg-yellow-500 text-white',
  closed: 'bg-gray-400 text-white',
  applied: 'bg-blue-500 text-white',
  interview_scheduled: 'bg-purple-500 text-white',
  rejected: 'bg-red-500 text-white',
  offer_received: 'bg-emerald-600 text-white',
};
const APP_METHOD_COLORS: Record<string, string> = {
  email: 'bg-blue-600 text-white',
  linkedin: 'bg-sky-600 text-white',
  indeed: 'bg-orange-500 text-white',
  glassdoor: 'bg-teal-600 text-white',
  company_portal: 'bg-indigo-600 text-white',
  other: 'bg-gray-500 text-white',
};

const APPLICATION_METHOD_OPTIONS = [
  "email",
  "linkedin",
  "job_search_site",
  "company_portal",
  "other",
];

export default function JobListingsDataTable({ jobListings, loading, onAdd, onUpdate }: JobListingsDataTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<JobListing>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["title", "company", "location", "salary_range", "application_method", "status", "created_at"]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filtering
  const filteredListings = useMemo(() => {
    if (!globalFilter) return jobListings;
    return jobListings.filter(j =>
      j.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
      j.location.toLowerCase().includes(globalFilter.toLowerCase()) ||
      j.salary_range.toLowerCase().includes(globalFilter.toLowerCase()) ||
      j.status.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [jobListings, globalFilter]);

  // Sorting
  const sortedListings = useMemo(() => {
    const arr = [...filteredListings];
    if (!sortBy) return arr;
    arr.sort((a, b) => {
      let aVal = a[sortBy as keyof JobListing];
      let bVal = b[sortBy as keyof JobListing];
      if (sortBy === 'created_at') {
        const aTime = new Date(aVal as string).getTime();
        const bTime = new Date(bVal as string).getTime();
        if (aTime < bTime) return sortDir === 'asc' ? -1 : 1;
        if (aTime > bTime) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredListings, sortBy, sortDir]);

  // Pagination
  const paginatedListings = useMemo(() => {
    const start = page * pageSize;
    return sortedListings.slice(start, start + pageSize);
  }, [sortedListings, page, pageSize]);

  // Inline edit handlers
  const startEdit = (job: JobListing) => {
    setEditingId(job.id);
    setEditValues(job);
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
    try {
      await onUpdate(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    } catch (err: any) {
      setEditError(err.message || "Failed to save changes");
    } finally {
      setEditSaving(false);
    }
  };

  // Column picker
  const allColumns = [
    { key: "title", label: "Title" },
    { key: "company", label: "Company" },
    { key: "location", label: "Location" },
    { key: "salary_range", label: "Salary" },
    { key: "application_method", label: "Application Method" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Created At" },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <Input
          placeholder="Search job listings..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex gap-2 items-center">
                <Settings2 className="w-4 h-4" /> Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="flex flex-col gap-2">
                {allColumns.map(col => (
                  <label key={col.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={visibleColumns.includes(col.key)}
                      onCheckedChange={checked => {
                        setVisibleColumns(cols =>
                          checked
                            ? [...cols, col.key]
                            : cols.filter(c => c !== col.key)
                        );
                      }}
                    />
                    {col.label}
                  </label>
                ))}
                <span className="text-xs text-muted-foreground mt-2">Actions always visible</span>
              </div>
            </PopoverContent>
          </Popover>
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="ml-2">Add Listing</Button>
          )}
        </div>
      </div>
      <div className="rounded-md border bg-background">
        <table className="w-full">
          <thead>
            <tr>
              {allColumns.filter(col => visibleColumns.includes(col.key)).map(col => {
                const isSortable = true;
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    className="p-2 text-left font-medium text-muted-foreground select-none cursor-pointer"
                    onClick={() => {
                      if (isSorted) {
                        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortBy(col.key);
                        setSortDir('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {isSorted && (sortDir === 'asc' ? <ArrowUp className="w-4 h-4 inline" /> : <ArrowDown className="w-4 h-4 inline" />)}
                    </div>
                  </th>
                );
              })}
              <th key="actions" className="p-2 text-right font-medium text-muted-foreground sticky right-0 bg-background z-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={visibleColumns.length + 1} className="p-4 text-center">Loading...</td></tr>
            ) : paginatedListings.length === 0 ? (
              <tr><td colSpan={visibleColumns.length + 1} className="p-4 text-center">No job listings found.</td></tr>
            ) : paginatedListings.map(job => (
              editingId === job.id ? (
                <tr key={job.id} className="bg-muted/30">
                  {allColumns.filter(col => visibleColumns.includes(col.key)).map(col => {
                    if (col.key === "title") return <td key={col.key} className="p-2"><Input value={editValues.title ?? ""} onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))} /></td>;
                    if (col.key === "company") return <td key={col.key} className="p-2"><Input value={editValues.company ?? ""} onChange={e => setEditValues(v => ({ ...v, company: e.target.value }))} /></td>;
                    if (col.key === "location") return <td key={col.key} className="p-2"><Input value={editValues.location ?? ""} onChange={e => setEditValues(v => ({ ...v, location: e.target.value }))} /></td>;
                    if (col.key === "salary_range") return <td key={col.key} className="p-2"><Input value={editValues.salary_range ?? ""} onChange={e => setEditValues(v => ({ ...v, salary_range: e.target.value }))} /></td>;
                    if (col.key === "application_method") return (
                      <td key={col.key} className="p-2">
                        <Select
                          value={editValues.application_method ?? job.application_method}
                          onValueChange={val => setEditValues(v => ({ ...v, application_method: val }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {APPLICATION_METHOD_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{formatLabel(opt)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    );
                    if (col.key === "status") return <td key={col.key} className="p-2">
                      <Select value={editValues.status ?? job.status} onValueChange={val => setEditValues(v => ({ ...v, status: val }))}>
                        <SelectTrigger><SelectValue /> </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt} value={opt}>{formatLabel(opt)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>;
                    if (col.key === "created_at") return <td key={col.key} className="p-2">{new Date(job.created_at).toLocaleDateString()}</td>;
                    return null;
                  })}
                  <td key="actions" className="p-2 sticky right-0 bg-background z-10 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={saveEdit} disabled={editSaving}><Save className="w-4 h-4 mr-1" />Save</Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                    </div>
                    {editError && <div className="text-destructive text-xs mt-1">{editError}</div>}
                  </td>
                </tr>
              ) : (
                <tr key={job.id}>
                  {allColumns.filter(col => visibleColumns.includes(col.key)).map(col => {
                    if (col.key === "title") return <td key={col.key} className="p-2">{job.title}</td>;
                    if (col.key === "company") return <td key={col.key} className="p-2">{job.company}</td>;
                    if (col.key === "location") return <td key={col.key} className="p-2">{job.location}</td>;
                    if (col.key === "salary_range") return <td key={col.key} className="p-2">{job.salary_range}</td>;
                    if (col.key === "application_method") return <td key={col.key} className="p-2">
                      <Badge className={`text-xs px-2 py-0.5 ${APP_METHOD_COLORS[job.application_method] || 'bg-gray-300 text-black'}`} style={{ pointerEvents: 'none' }}>
                        {formatLabel(job.application_method)}
                      </Badge>
                    </td>;
                    if (col.key === "status") return <td key={col.key} className="p-2">
                      <Badge className={`text-xs px-2 py-0.5 ${STATUS_COLORS[job.status] || 'bg-gray-300 text-black'}`} style={{ pointerEvents: 'none' }}>
                        {formatLabel(job.status)}
                      </Badge>
                    </td>;
                    if (col.key === "created_at") return <td key={col.key} className="p-2">{new Date(job.created_at).toLocaleDateString()}</td>;
                    return null;
                  })}
                  <td key="actions" className="p-2 sticky right-0 bg-background z-10 text-right">
                    <div className="flex justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `/dashboard/job-listings/send-email?listing=${job.id}`}
                                disabled={job.has_campaign}
                                className={job.has_campaign ? 'cursor-not-allowed opacity-50' : ''}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {job.has_campaign && (
                            <TooltipContent>
                              <p>Email Sent</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="outline" size="sm" onClick={() => startEdit(job)}>
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {page + 1} of {Math.ceil(filteredListings.length / pageSize)}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(Math.ceil(filteredListings.length / pageSize) - 1, p + 1))}
              disabled={page >= Math.ceil(filteredListings.length / pageSize) - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
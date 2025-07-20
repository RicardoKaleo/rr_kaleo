"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { 
  Mail, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  User, 
  Linkedin, 
  FileText, 
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Clock,
  Calendar,
  RefreshCw
} from 'lucide-react';
// Import TinyMCE editor and dropzone
import { Editor } from '@tinymce/tinymce-react';
import Dropzone from '@/components/ui/dropzone';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface FollowUpEmail {
  enabled: boolean;
  templateId: string;
  daysAfter: number;
}

export default function SendEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = searchParams.get("listing");
  const [listing, setListing] = useState<any>(null);
  const [recruiter, setRecruiter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [campaignExists, setCampaignExists] = useState(false);
  
  // Email template and follow-up states
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [followUpEmails, setFollowUpEmails] = useState<FollowUpEmail[]>([
    { enabled: false, templateId: "", daysAfter: 3 },
    { enabled: false, templateId: "", daysAfter: 7 }
  ]);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      const supabase = createBrowserSupabaseClient();
      
      // Check for existing campaign using the new API endpoint
      try {
        const response = await fetch(`/api/campaigns/check-exists?jobListingId=${listingId}`);
        const { exists } = await response.json();
        
        if (exists) {
          setCampaignExists(true);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking campaign existence:', error);
        // Continue with the flow even if the check fails
      }

      // Fetch job listing
      const { data: job, error: jobError } = await supabase
        .from("job_listings")
        .select("*")
        .eq("id", listingId)
        .single();
      if (jobError || !job) {
        setError("Job listing not found.");
        setLoading(false);
        return;
      }
      setListing(job);
      
      // Fetch recruiter via job_recruiters
      const { data: jobRecruiter } = await supabase
        .from("job_recruiters")
        .select("recruiter_id")
        .eq("job_listing_id", listingId)
        .single();
      if (!jobRecruiter || !jobRecruiter.recruiter_id) {
        setError("No recruiter assigned to this job listing.");
        setLoading(false);
        return;
      }
      
      // Fetch recruiter details
      const { data: recruiterData } = await supabase
        .from("recruiters")
        .select("name, email, company, position, linkedin_url")
        .eq("id", jobRecruiter.recruiter_id)
        .single();
      if (!recruiterData) {
        setError("Recruiter not found.");
        setLoading(false);
        return;
      }
      setRecruiter(recruiterData);
      
      // Fetch email templates
      if (user?.id) {
        const { data: templatesData, error: templatesError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!templatesError && templatesData) {
          setTemplates(templatesData);
          // Set default template if available
          const defaultTemplate = templatesData.find(t => t.is_default);
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id);
            setEmailSubject(defaultTemplate.subject);
            setEmailBody(defaultTemplate.body);
          }
        }
      }
      
      setLoading(false);
    }
    if (listingId) fetchData();
  }, [listingId, user?.id]);

  // Check if TinyMCE script is loaded
  useEffect(() => {
    const checkTinyMCE = () => {
      if (typeof window !== 'undefined' && (window as any).tinymce) {
        console.log('TinyMCE is available globally');
        setEditorLoaded(true);
      } else {
        console.log('TinyMCE not found, checking script...');
        const script = document.querySelector('script[src="/tinymce/tinymce.min.js"]');
        if (script) {
          console.log('TinyMCE script found in DOM');
        } else {
          console.log('TinyMCE script not found in DOM');
        }
      }
    };

    // Check immediately
    checkTinyMCE();

    // Check again after a delay
    const timer = setTimeout(checkTinyMCE, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleFileDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && acceptedFiles[0].type === "application/pdf") {
      setFile(acceptedFiles[0]);
      toast.success("Resume attached successfully");
    } else {
      toast.error("Only PDF files are allowed.");
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    }
  };

  const handleFollowUpChange = (index: number, field: keyof FollowUpEmail, value: any) => {
    const updatedFollowUps = [...followUpEmails];
    updatedFollowUps[index] = { ...updatedFollowUps[index], [field]: value };
    setFollowUpEmails(updatedFollowUps);
  };

  const handleSend = async () => {
    if (!emailBody.trim() || !file || !emailSubject.trim()) {
      toast.error("Please fill in the email subject, body and attach a resume");
      return;
    }
    

    
    setSending(true);
    try {
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer();
      const base64Content = Buffer.from(fileBuffer).toString('base64');
      
      // Prepare the request payload
      const payload = {
        jobListingId: listingId!,
        templateId: selectedTemplateId || undefined,
        customSubject: emailSubject,
        customBody: emailBody,
        recipientEmail: recruiter.email,
        recipientName: recruiter.name,
        resumeFile: {
          name: file.name,
          content: base64Content,
          type: file.type
        },
        followUpEmails: followUpEmails
      };

      // Send email via API
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      toast.success("Email sent successfully!");
      router.push("/dashboard/job-listings");
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleEditorInit = (evt: any, editor: any) => {
    console.log('TinyMCE editor initialized:', editor);
    setEditorLoaded(true);
  };

  // Replace variables in email content
  const replaceVariables = (content: string) => {
    if (!listing || !recruiter) return content;
    
    return content
      .replace(/\[job_title\]/g, listing.title || '')
      .replace(/\[job_company\]/g, listing.company || '')
      .replace(/\[recruiter_name\]/g, recruiter.name || '')
      .replace(/\[client_first_name\]/g, user?.user_metadata?.first_name || '')
      .replace(/\[client_last_name\]/g, user?.user_metadata?.last_name || '')
      .replace(/\[client_phone\]/g, user?.user_metadata?.phone || '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (campaignExists) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-center">
        <Card className="inline-block">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive">Campaign Already Sent</CardTitle>
            <CardDescription>
              An email campaign has already been sent for this job listing. You cannot send another one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Mail className="w-8 h-8 text-primary" />
              Send Email
            </h1>
            <p className="text-muted-foreground mt-1">
              Compose and send an email to the recruiter
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Job & Recruiter Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Job Listing Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                <p className="font-medium mt-1">{listing.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                <p className="font-medium mt-1">{listing.company}</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{listing.location}</span>
              </div>
              {listing.job_url && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Job URL</Label>
                  <a 
                    href={listing.job_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-primary hover:underline mt-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">View Job Posting</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recruiter Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Recruiter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="font-medium mt-1">{recruiter.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="font-medium mt-1 text-primary">{recruiter.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                <p className="font-medium mt-1">{recruiter.company}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                <p className="font-medium mt-1">{recruiter.position}</p>
              </div>
              {recruiter.linkedin_url && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">LinkedIn</Label>
                  <a 
                    href={recruiter.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-primary hover:underline mt-1"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">View Profile</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Email Composition */}
        <div className="lg:col-span-3 space-y-6">
          {/* Email Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Email Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-select" className="text-sm font-medium">
                    Select Template
                  </Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Choose an email template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {template.name}
                            {template.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {templates.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <a 
                        href="/dashboard/email-templates" 
                        className="text-primary hover:underline"
                      >
                        Create email templates
                      </a>{" "}
                      to get started
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Subject */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5" />
                Email Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Email Body */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5" />
                Email Body
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!editorLoaded && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading rich text editor...
                </div>
              )}
              <Editor
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                value={emailBody}
                onEditorChange={setEmailBody}
                onInit={handleEditorInit}
                init={{
                  height: 300,
                  menubar: false,
                  plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table paste code help wordcount'
                  ],
                  toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.6; }',
                  placeholder: 'Write your email message here...'
                }}
              />
              {!editorLoaded && (
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your email message here..."
                  className="w-full h-80 p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              )}
            </CardContent>
          </Card>

          {/* Follow-up Emails */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="w-5 h-5" />
                Follow-up Emails
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule automatic follow-up emails if you don't receive a response
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {followUpEmails.map((followUp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`followup-${index}`}
                        checked={followUp.enabled}
                        onCheckedChange={(checked) => 
                          handleFollowUpChange(index, 'enabled', checked)
                        }
                      />
                      <Label htmlFor={`followup-${index}`} className="font-medium">
                        {index === 0 ? '2nd Follow-up Email' : '3rd Follow-up Email'}
                      </Label>
                    </div>
                    
                    {followUp.enabled && (
                      <div className="space-y-4 pl-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Template</Label>
                                                         <Select 
                               value={followUp.templateId} 
                               onValueChange={(value) => handleFollowUpChange(index, 'templateId', value)}
                             >
                               <SelectTrigger className="w-full mt-1">
                                 <SelectValue placeholder="Select template..." />
                               </SelectTrigger>
                               <SelectContent>
                                 {templates.length === 0 ? (
                                   <SelectItem value="no-templates" disabled>
                                     No templates available
                                   </SelectItem>
                                 ) : (
                                   templates.map((template) => (
                                     <SelectItem key={template.id} value={template.id}>
                                       {template.name}
                                     </SelectItem>
                                   ))
                                 )}
                               </SelectContent>
                             </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Days After</Label>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              value={followUp.daysAfter}
                              onChange={(e) => handleFollowUpChange(index, 'daysAfter', parseInt(e.target.value) || 1)}
                              className="w-full mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Attachment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Resume Attachment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dropzone accept="application/pdf" onDrop={handleFileDrop} file={file} />
              {file && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">
                    Resume attached: {file.name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {emailBody.trim() && file && emailSubject.trim() ? (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready to send
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Please fill in the email subject, body and attach a resume
                </span>
              )}
            </div>
            <Button 
              size="lg" 
              onClick={handleSend} 
              disabled={!emailBody.trim() || !file || !emailSubject.trim() || sending}
              className="min-w-[140px]"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 